import copy
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("prepare_pyq_import", Path(__file__).parents[1] / "scripts/prepare_pyq_import.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ImportValidationTests(unittest.TestCase):
    def setUp(self):
        # Synthetic validator fixture only; never imported or labelled authentic.
        self.row = dict(exam="jee_main", year=2025, subject="math", chapter_name="Fixture", difficulty="easy", question_type="single", prompt="Fixture question", options=[dict(id="A", text="One"), dict(id="B", text="Two")], answer=["A"], source_url="https://example.org/paper.pdf", source_label="Validation fixture", source_question="Fixture 1", verified_by_source="https://example.org/key.pdf", explanation="Fixture explanation", steps=["Fixture step"])

    def test_requires_paper_and_answer_key_sources(self):
        for field in ["source_url", "verified_by_source"]:
            row = copy.deepcopy(self.row)
            row[field] = ""
            with self.assertRaises(ValueError):
                module.validate_batch([row])

    def test_rejects_duplicate_question(self):
        with self.assertRaises(ValueError):
            module.validate_batch([self.row, self.row])

    def test_single_answer_must_reference_exactly_one_existing_option(self):
        for answer in [[], ["C"], ["A", "B"], ["A", "A"]]:
            row = copy.deepcopy(self.row)
            row["answer"] = answer
            with self.assertRaises(ValueError):
                module.validate_batch([row])

    def test_integer_key_cannot_be_fractional(self):
        row = dict(self.row, question_type="integer", options=[], answer="1.5")
        with self.assertRaises(ValueError):
            module.validate_batch([row])

    def test_valid_choice_batch_passes(self):
        self.assertEqual(len(module.validate_batch([self.row])), 1)


if __name__ == "__main__":
    unittest.main()