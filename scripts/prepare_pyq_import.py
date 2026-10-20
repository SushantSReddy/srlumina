"""Validate reviewed PYQ batches and emit additive SQL; never publish answer-key files.

Usage: python3 scripts/prepare_pyq_import.py batch.json [...] > /tmp/pyq-import.sql
Apply only through a privileged data-insert connection. No student records are touched.
"""
import json
import math
import sys
import uuid
from urllib.parse import urlparse


def https_url(value):
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.hostname)


def validate_batch(rows):
    seen = set()
    for row in rows:
        if row.get("exam") not in {"jee_main", "jee_advanced", "neet"}:
            raise ValueError("Unsupported exam")
        if not isinstance(row.get("year"), int) or not 1980 <= row["year"] <= 2100:
            raise ValueError("Invalid year")
        if row.get("subject") not in {"physics", "chemistry", "math", "biology"}:
            raise ValueError("Invalid subject")
        if (row["exam"] == "neet" and row["subject"] == "math") or (row["exam"] != "neet" and row["subject"] == "biology"):
            raise ValueError("Subject does not belong to exam")
        for name in ["prompt", "source_label", "source_question", "chapter_name", "explanation"]:
            if not isinstance(row.get(name), str) or not row[name].strip():
                raise ValueError(f"Missing {name}")
        for name in ["source_url", "verified_by_source"]:
            if not isinstance(row.get(name), str) or not https_url(row[name]):
                raise ValueError(f"Missing HTTPS provenance: {name}")
        identity = (row["exam"], row["year"], row["source_url"], row["source_question"])
        if identity in seen:
            raise ValueError("Duplicate source question")
        seen.add(identity)
        if row.get("difficulty") not in {"easy", "medium", "hard"}:
            raise ValueError("Invalid difficulty")
        if row.get("question_type") not in {"single", "multiple", "matching", "numerical", "integer"}:
            raise ValueError("Unsupported question type")
        if not isinstance(row.get("steps"), list) or not all(isinstance(s, str) and s.strip() for s in row["steps"]):
            raise ValueError("Invalid solution steps")
        tolerance = row.get("tolerance", 0)
        if not isinstance(tolerance, (float, int)) or not math.isfinite(tolerance) or tolerance < 0:
            raise ValueError("Invalid numerical tolerance")
        options = row.get("options", [])
        if not isinstance(options, list):
            raise ValueError("Invalid options")
        ids = []
        for option in options:
            if not isinstance(option, dict) or not isinstance(option.get("id"), str) or not isinstance(option.get("text"), str) or not option["text"].strip():
                raise ValueError("Invalid option")
            ids.append(option["id"])
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate option ID")
        if row["question_type"] in {"single", "multiple", "matching"}:
            answer = row.get("answer")
            if not isinstance(answer, list) or not answer or not all(a in ids for a in answer) or len(answer) != len(set(answer)):
                raise ValueError("Answer must reference distinct existing options")
            if row["question_type"] == "single" and len(answer) != 1:
                raise ValueError("Single-correct requires exactly one answer")
        else:
            try:
                numeric = float(row["answer"])
            except (TypeError, ValueError, KeyError):
                raise ValueError("Invalid numerical key") from None
            if not math.isfinite(numeric) or (row["question_type"] == "integer" and not numeric.is_integer()):
                raise ValueError("Invalid numerical key")
        if row.get("diagram_url") and not https_url(row["diagram_url"]):
            raise ValueError("Invalid diagram URL")
    return rows


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def sql_for(rows):
    validate_batch(rows)
    chunks = ["BEGIN;"]
    for row in rows:
        chapter = literal(row["chapter_name"])
        subject = literal(row["subject"])
        chunks.append(f"INSERT INTO public.pyq_chapters(subject,name) VALUES({subject},{chapter}) ON CONFLICT DO NOTHING;")
        question_id = str(uuid.uuid5(uuid.NAMESPACE_URL, "|".join(str(row[k]) for k in ["exam", "year", "source_url", "source_question"])))
        fields = ["exam", "year", "difficulty", "question_type", "prompt", "source_url", "source_label", "source_question"]
        values = ",".join(literal(row[k]) for k in fields)
        options = literal(json.dumps(row.get("options", []))) + "::jsonb"
        diagram = literal(row["diagram_url"]) if row.get("diagram_url") else "NULL"
        chunks.append(f"INSERT INTO public.pyq_questions(id,chapter_id,{','.join(fields)},options,diagram_url,verified) SELECT {literal(question_id)},id,{values},{options},{diagram},true FROM public.pyq_chapters WHERE subject={subject} AND name={chapter} ON CONFLICT DO NOTHING;")
        # Resolve by provenance, preserving the identity of any already-imported row.
        condition = " AND ".join(f"{k}={literal(row[k])}" for k in ["exam", "year", "source_url", "source_question"])
        answer = literal(json.dumps(row["answer"])) + "::jsonb"
        steps = literal(json.dumps(row["steps"])) + "::jsonb"
        chunks.append(f"INSERT INTO public.pyq_answer_keys(question_id,answer,tolerance,explanation,steps,verified_by_source) SELECT id,{answer},{row.get('tolerance', 0)},{literal(row['explanation'])},{steps},{literal(row['verified_by_source'])} FROM public.pyq_questions WHERE {condition} ON CONFLICT DO NOTHING;")
    chunks.append("COMMIT;")
    return "\n".join(chunks)


if __name__ == "__main__":
    rows = []
    for path in sys.argv[1:]:
        with open(path) as file:
            rows.extend(json.load(file))
    if not rows:
        raise SystemExit("Provide at least one reviewed JSON batch")
    print(sql_for(rows))