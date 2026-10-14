"""Integration tests use isolated data and real PDF/PPTX extraction, no live provider."""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from learnproof import api, assessment, ingestion, provider, sample, store


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.directory = Path(cls.temp.name)
        cls.original_data = {}
        for module in (store, api, ingestion, sample):
            cls.original_data[module] = module.DATA
            module.DATA = cls.directory
        cls.key_patch = patch.dict("os.environ", {"GEMINI_API_KEY": ""})
        cls.key_patch.start()
        cls.client_context = TestClient(api.app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)
        cls.key_patch.stop()
        for module, value in cls.original_data.items():
            module.DATA = value
        cls.temp.cleanup()

    def profile(self):
        learner = self.client.post(
            "/api/learners", json={"name": "Test learner"}
        ).json()
        return {"X-Learner-ID": learner["id"]}

    def test_sample_sources_and_real_locator_images(self):
        sources = self.client.get("/api/courses/data-structures/sources").json()
        self.assertEqual(len([s for s in sources if s["status"] == "indexed"]), 2)
        for source in sources:
            units = self.client.get(f"/api/sources/{source['id']}/units").json()
            self.assertEqual(len(units), 6)
            self.assertEqual(units[0]["page"], 1)
            if source["kind"] == "pptx" and os.getenv("REQUIRE_SLIDE_RENDER") == "1":
                self.assertTrue(all("rendered-slide" in u["extraction"] for u in units))
            response = self.client.get(units[0]["image_url"])
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.content.startswith(b"\x89PNG"))

    def test_question_endpoint_hides_answer_keys(self):
        result = self.client.post(
            "/api/courses/data-structures/practice",
            headers=self.profile(),
            json={"concept": "complexity", "kind": "mcq", "adaptive": False},
        ).json()
        question = result["question"]
        self.assertNotIn("answer", question)
        self.assertNotIn("payload", question)
        self.assertTrue(question["citations"])

    def test_scored_persistence_duplicate_prevention_and_isolation(self):
        headers = self.profile()
        practice = {"concept": "complexity", "kind": "mcq", "adaptive": False}
        question = self.client.post(
            "/api/courses/data-structures/practice", headers=headers, json=practice
        ).json()["question"]
        answer = self.client.post(
            f"/api/questions/{question['id']}/answer",
            headers=headers,
            json={"answer": question["options"][0]},
        )
        self.assertEqual(answer.status_code, 200)
        self.assertFalse(answer.json()["correct"])
        state = self.client.get(
            "/api/courses/data-structures/progress", headers=headers
        ).json()
        self.assertEqual(state["scored_attempts"], 1)
        again = self.client.post(
            f"/api/questions/{question['id']}/answer",
            headers=headers,
            json={"answer": question["options"][0]},
        )
        self.assertEqual(again.status_code, 409)
        next_item = self.client.post(
            "/api/courses/data-structures/practice", headers=headers, json=practice
        ).json()["question"]
        self.assertNotEqual(question["id"], next_item["id"])
        other = self.client.get(
            "/api/courses/data-structures/progress", headers=self.profile()
        ).json()
        self.assertEqual(other["total_attempts"], 0)

    def test_ambiguous_short_answer_never_inflates_mastery(self):
        headers = self.profile()
        question = self.client.post(
            "/api/courses/data-structures/practice",
            headers=headers,
            json={"concept": "pointers", "kind": "short", "adaptive": False},
        ).json()["question"]
        result = self.client.post(
            f"/api/questions/{question['id']}/answer",
            headers=headers,
            json={"answer": "maybe something else"},
        ).json()
        self.assertIsNone(result["correct"])
        self.assertEqual(result["prior"], result["estimate"])
        self.assertEqual(
            self.client.get(
                "/api/courses/data-structures/progress", headers=headers
            ).json()["scored_attempts"],
            0,
        )

    def test_numerical_grading_and_nonfinite_rejection(self):
        headers = self.profile()
        path = "/api/questions/authored-17/answer"
        self.assertEqual(
            self.client.post(path, headers=headers, json={"answer": "NaN"}).status_code,
            400,
        )
        result = self.client.post(path, headers=headers, json={"answer": "5"}).json()
        self.assertTrue(result["correct"])

    def test_local_tutor_and_refusal(self):
        result = self.client.post(
            "/api/courses/data-structures/chat",
            json={"question": "How does linked-list traversal work?"},
        ).json()
        self.assertEqual(result["mode"], "local-excerpts")
        self.assertTrue(result["claims"])
        self.assertTrue(result["citations"])
        self.assertIn("Traversal starts", " ".join(c["text"] for c in result["claims"]))
        refused = self.client.post(
            "/api/courses/data-structures/chat",
            json={"question": "Who won the football world cup?"},
        ).json()
        self.assertEqual(refused["status"], "unsupported")
        self.assertEqual(refused["citations"], [])

    def test_live_tutor_rejects_fabricated_citation(self):
        with (
            patch.object(provider, "configured", return_value=True),
            patch.object(
                provider,
                "generate",
                return_value={
                    "claims": [
                        {"text": "Invented fact", "source_ids": ["invented-source"]}
                    ]
                },
            ),
        ):
            result = self.client.post(
                "/api/courses/data-structures/chat",
                json={"question": "How does traversal work?"},
            )
        self.assertEqual(result.status_code, 502)

    def test_live_tutor_rejects_unsupported_claim(self):
        def fake(prompt, *args, **kwargs):
            if kwargs.get("verifier"):
                return {"supported": False}
            unit = store.rows("SELECT id FROM units LIMIT 1")[0]["id"]
            # Use an actual retrieved ID to exercise support verification, not only locator checks.
            evidence = api.tutoring.retrieve(
                "data-structures", "How does traversal work?"
            )
            return {
                "claims": [
                    {"text": "Unsupported detail", "source_ids": [evidence[0]["id"]]}
                ]
            }

        with (
            patch.object(provider, "configured", return_value=True),
            patch.object(provider, "generate", side_effect=fake),
        ):
            result = self.client.post(
                "/api/courses/data-structures/chat",
                json={"question": "How does traversal work?"},
            ).json()
        self.assertEqual(result["status"], "unsupported")

    def test_upload_validation_and_failure_status(self):
        course = self.client.post(
            "/api/courses", json={"name": "Fresh upload course"}
        ).json()["id"]
        bad_type = self.client.post(
            f"/api/courses/{course}/sources", files={"file": ("file.exe", b"invalid")}
        )
        self.assertEqual(bad_type.status_code, 400)
        result = self.client.post(
            f"/api/courses/{course}/sources",
            files={"file": ("broken.pdf", b"not a PDF")},
        )
        self.assertEqual(result.status_code, 200)
        source = self.client.get(f"/api/courses/{course}/sources").json()[0]
        self.assertEqual(source["status"], "failed")
        self.assertEqual(source["unit_count"], 0)
        valid_pdf = self.directory / "sample" / "LearnProof-course-notes.pdf"
        uploaded = self.client.post(
            f"/api/courses/{course}/sources",
            files={"file": ("fresh.pdf", valid_pdf.read_bytes(), "application/pdf")},
        ).json()
        self.assertEqual(
            len(self.client.get(f"/api/sources/{uploaded['id']}/units").json()), 6
        )

    def test_video_without_key_has_explicit_failure(self):
        course = self.client.post(
            "/api/courses", json={"name": "Video test course"}
        ).json()["id"]
        self.client.post(
            f"/api/courses/{course}/sources",
            files={"file": ("lecture.mp4", b"fake-video", "video/mp4")},
        )
        source = self.client.get(f"/api/courses/{course}/sources").json()[0]
        self.assertEqual(source["status"], "failed")
        self.assertIn("GEMINI_API_KEY", source["error"])

    def test_origin_boundary_and_missing_profile(self):
        self.assertEqual(
            self.client.post(
                "/api/learners",
                json={"name": "Nope"},
                headers={"Origin": "https://untrusted.example"},
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                "/api/courses/data-structures/progress",
                headers={"X-Learner-ID": "missing"},
            ).status_code,
            404,
        )

    def test_no_fabricated_benchmark(self):
        result = self.client.get("/api/courses/data-structures/evaluation").json()
        self.assertEqual(result["status"], "not-run")
        self.assertNotIn("metrics", result)

    def test_bounded_numerical_verification(self):
        self.assertEqual(assessment.arithmetic("3+4-2"), 5)
        for expression in ["__import__('os')", "2**100", "10000000*10"]:
            with self.assertRaises(ValueError):
                assessment.arithmetic(expression)


if __name__ == "__main__":
    unittest.main()
