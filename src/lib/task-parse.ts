export type ParsedTask = {
  title: string;
  due_on: string | null;
  due_time: string | null;
  subject: "physics" | "chemistry" | "math" | "biology" | null;
  question_target: number | null;
  priority: "low" | "medium" | "high" | null;
};

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Fast, offline natural-language parsing for quick add.
 * "Solve 20 physics questions tomorrow 7pm" -> structured task.
 */
export function parseTaskInput(raw: string, now = new Date()): ParsedTask {
  let text = ` ${raw.trim()} `;
  const out: ParsedTask = {
    title: raw.trim(),
    due_on: null,
    due_time: null,
    subject: null,
    question_target: null,
    priority: null,
  };
  const strip = (re: RegExp) => {
    text = text.replace(re, " ");
  };
  const lower = () => text.toLowerCase();

  // --- subject ---
  const subjects: [ParsedTask["subject"], RegExp][] = [
    ["physics", /\bphysics\b|\bphy\b/i],
    ["chemistry", /\bchemistry\b|\bchem\b/i],
    ["math", /\bmaths?\b|\bmathematics\b/i],
    ["biology", /\bbiology\b|\bbio\b/i],
  ];
  for (const [id, re] of subjects) {
    if (re.test(text)) {
      out.subject = id;
      break;
    }
  }

  // --- question count ---
  const qm = lower().match(/\b(\d{1,4})\s*(?:questions?|qs?|problems?|sums?)\b/);
  if (qm?.[1]) out.question_target = Number(qm[1]);

  // --- priority ---
  if (/\b(high priority|urgent|important|!!)\b/i.test(text)) out.priority = "high";
  else if (/\b(low priority|whenever|someday)\b/i.test(text)) out.priority = "low";
  strip(/\b(high priority|low priority|urgent|important)\b/gi);

  // --- date ---
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const l = lower();
  if (/\btoday\b/.test(l)) {
    out.due_on = iso(base);
    strip(/\btoday\b/gi);
  } else if (/\btomorrow\b|\btmrw\b/.test(l)) {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    out.due_on = iso(d);
    strip(/\btomorrow\b|\btmrw\b/gi);
  } else if (/\bday after tomorrow\b/.test(l)) {
    const d = new Date(base);
    d.setDate(d.getDate() + 2);
    out.due_on = iso(d);
    strip(/\bday after tomorrow\b/gi);
  } else if (/\bnext week\b/.test(l)) {
    const d = new Date(base);
    d.setDate(d.getDate() + 7);
    out.due_on = iso(d);
    strip(/\bnext week\b/gi);
  } else {
    const inM = l.match(/\bin (\d{1,3}) (day|days|week|weeks)\b/);
    if (inM) {
      const n = Number(inM[1]);
      const d = new Date(base);
      d.setDate(d.getDate() + (inM[2]!.startsWith("week") ? n * 7 : n));
      out.due_on = iso(d);
      strip(/\bin \d{1,3} (day|days|week|weeks)\b/gi);
    } else {
      for (let i = 0; i < WEEKDAYS.length; i++) {
        const name = WEEKDAYS[i]!;
        const re = new RegExp(`\\b(?:next |on |this )?${name}\\b`, "i");
        if (re.test(l)) {
          const d = new Date(base);
          const delta = (i - d.getDay() + 7) % 7 || 7;
          d.setDate(d.getDate() + delta);
          out.due_on = iso(d);
          strip(new RegExp(`\\b(?:next |on |this )?${name}\\b`, "gi"));
          break;
        }
      }
    }
  }

  // --- time ---
  const t12 = lower().match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  const t24 = lower().match(/\b(?:at\s*)?(\d{1,2}):(\d{2})\b/);
  if (t12) {
    let h = Number(t12[1]) % 12;
    if (t12[3] === "pm") h += 12;
    out.due_time = `${String(h).padStart(2, "0")}:${t12[2] ?? "00"}`;
    strip(/\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi);
  } else if (t24) {
    out.due_time = `${String(Number(t24[1])).padStart(2, "0")}:${t24[2]}`;
    strip(/\b(?:at\s*)?\d{1,2}:\d{2}\b/gi);
  } else if (/\bmorning\b/i.test(text)) {
    out.due_time = "08:00";
    strip(/\b(in the )?morning\b/gi);
  } else if (/\bafternoon\b/i.test(text)) {
    out.due_time = "14:00";
    strip(/\b(in the )?afternoon\b/gi);
  } else if (/\bevening\b/i.test(text)) {
    out.due_time = "18:00";
    strip(/\b(in the )?evening\b/gi);
  } else if (/\bnight\b/i.test(text)) {
    out.due_time = "21:00";
    strip(/\b(at )?night\b/gi);
  }

  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim()
    .replace(/^(and|at|on|by)\s+/i, "")
    .replace(/\s+(at|on|by|in)$/i, "");
  if (cleaned.length >= 2) {
    out.title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return out;
}
