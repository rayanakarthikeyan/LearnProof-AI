"""Submission-critical regressions share the isolated API fixture."""

import json
import unittest
from unittest.mock import patch
from tests import test_api as api_fixture
from learnproof import assessment, concepts, provider, store
from learnproof.retrieval import cosine, fuse


class SubmissionTests(api_fixture.ApiTests):
    # Inherit the isolated app lifecycle, not the existing test methods.
    def test_course_topics_are_not_global_demo_topics(self):
        course = self.client.post("/api/courses", json={"name": "Biology"}).json()["id"]
        self.assertEqual(
            self.client.get(f"/api/courses/{course}/progress").json()["topics"], []
        )
        source = store.uid("source")
        store.execute(
            "INSERT INTO sources(id,course_id,name,kind,path,hash,status,warnings) VALUES (?,?,?,?,?,?,?,?)",
            (source, course, "Biology notes", "pdf", "unused", "hash", "indexed", "[]"),
        )
        unit = store.uid("unit")
        store.execute(
            "INSERT INTO units VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (
                unit,
                source,
                course,
                "Photosynthesis\nPlants use light to produce sugars.",
                "[]",
                1,
                None,
                None,
                None,
                "",
                "text",
            ),
        )
        concepts.discover(course)
        topics = self.client.get(f"/api/courses/{course}/progress").json()["topics"]
        self.assertTrue(topics)
        self.assertIn("Photosynthesis", topics[0]["name"])
        self.assertNotIn("pointers", [t["id"] for t in topics])

    def test_concept_graph_rejects_cycles_and_fake_evidence(self):
        item = {
            "id": "a",
            "name": "Topic A",
            "description": "A",
            "prerequisites": [],
            "unit_ids": ["real"],
        }
        self.assertIn("a", concepts.validate_graph([item], {"real"}))
        for candidates in [
            [item | {"prerequisites": ["a"]}],
            [item | {"unit_ids": ["fake"]}],
        ]:
            with self.assertRaises(ValueError):
                concepts.validate_graph(candidates, {"real"})

    def test_exam_scope_novelty_keys_and_profile_boundary(self):
        headers = self.profile()
        body = {
            "concepts": ["stacks", "queues"],
            "kinds": ["mcq", "short", "numerical"],
            "count": 6,
        }
        created = self.client.post(
            "/api/courses/data-structures/exams", headers=headers, json=body
        )
        self.assertEqual(created.status_code, 200)
        exam = created.json()
        self.assertEqual(len(exam["questions"]), 6)
        self.assertEqual(
            {q["kind"] for q in exam["questions"]}, {"mcq", "short", "numerical"}
        )
        self.assertTrue(
            all("answer" not in q and "payload" not in q for q in exam["questions"])
        )
        practice = self.client.post(
            "/api/courses/data-structures/practice",
            headers=headers,
            json={"concept": "stacks", "kind": "mcq", "adaptive": False},
        ).json()
        self.assertIsNone(practice["question"])
        self.assertEqual(
            self.client.get(
                f"/api/exams/{exam['id']}", headers=self.profile()
            ).status_code,
            404,
        )
        for q in exam["questions"]:
            payload = json.loads(
                store.rows("SELECT payload FROM questions WHERE id=?", (q["id"],))[0][
                    "payload"
                ]
            )
            self.assertEqual(
                self.client.post(
                    f"/api/questions/{q['id']}/answer",
                    headers=headers,
                    json={"answer": payload["answer"]},
                ).status_code,
                200,
            )
        report = self.client.get(f"/api/exams/{exam['id']}", headers=headers).json()
        self.assertTrue(report["completed"])
        self.assertEqual(report["correct"], 6)
        self.assertEqual(
            self.client.post(
                "/api/courses/data-structures/exams", headers=headers, json=body
            ).status_code,
            400,
        )

    def test_repair_persists_and_returns_to_unseen_transfer(self):
        headers = self.profile()
        self.client.post(
            "/api/questions/authored-11/answer",
            headers=headers,
            json={"answer": "Yes, all insertion work is O(1)"},
        )
        started = self.client.post(
            "/api/courses/data-structures/repair",
            headers=headers,
            json={"failed_question": "authored-11"},
        ).json()
        self.assertEqual(started["stage"], "diagnostic")
        self.assertEqual(started["probe"], "traversal")
        self.assertIsNone(started["feedback"])
        q = started["question"]
        self.client.post(
            f"/api/questions/{q['id']}/answer", headers=headers, json={"answer": "O(n)"}
        )
        resumed = self.client.get(
            "/api/courses/data-structures/repair", headers=headers
        ).json()
        self.assertTrue(resumed["feedback"]["correct"])
        transfer = self.client.post(
            "/api/courses/data-structures/repair", headers=headers, json={}
        ).json()
        self.assertEqual(transfer["stage"], "transfer")
        self.assertNotEqual(transfer["question"]["id"], "authored-11")
        self.client.post(
            f"/api/questions/{transfer['question']['id']}/answer",
            headers=headers,
            json={"answer": "O(1)"},
        )
        finished = self.client.post(
            "/api/courses/data-structures/repair", headers=headers, json={}
        ).json()
        self.assertEqual(finished["stage"], "complete")
        self.assertIsNone(
            self.client.get(
                "/api/courses/data-structures/repair", headers=headers
            ).json()
        )

    def test_unscored_probe_cannot_establish_diagnosis(self):
        headers = self.profile()
        self.client.post(
            "/api/questions/authored-15/answer", headers=headers, json={"answer": "A"}
        )
        repair = self.client.post(
            "/api/courses/data-structures/repair",
            headers=headers,
            json={"failed_question": "authored-15"},
        ).json()
        self.client.post(
            f"/api/questions/{repair['question']['id']}/answer",
            headers=headers,
            json={"answer": "unclear wording"},
        )
        self.assertEqual(
            self.client.post(
                "/api/courses/data-structures/repair", headers=headers, json={}
            ).status_code,
            400,
        )

    def test_generated_candidates_reject_malformed_values(self):
        candidate = {
            "prompt": "What is a valid question?",
            "answer": "2",
            "feedback": "Two.",
            "difficulty": 1,
            "source_ids": ["real"],
            "aliases": [],
            "options": ["1", "2"],
            "calculation": "1+1",
        }
        assessment.validated_candidate(candidate, "numerical", {"real"})
        for bad in [
            candidate | {"source_ids": "real"},
            candidate | {"difficulty": True},
            candidate | {"answer": "NaN"},
            candidate | {"calculation": "2**50"},
        ]:
            with self.assertRaises((ValueError, ArithmeticError)):
                assessment.validated_candidate(bad, "numerical", {"real"})

    def test_supported_chat_does_not_display_uncited_model_message(self):
        evidence = self.client.post(
            "/api/courses/data-structures/chat",
            json={"question": "How does traversal work?"},
        ).json()["citations"][0]["id"]
        with (
            patch.object(provider, "configured", return_value=True),
            patch.object(
                provider,
                "generate",
                side_effect=[
                    {
                        "claims": [
                            {
                                "text": "Traversal follows next references.",
                                "source_ids": [evidence],
                            }
                        ],
                        "message": "Invented uncited information",
                    },
                    {"supported": True},
                ],
            ),
        ):
            response = self.client.post(
                "/api/courses/data-structures/chat",
                json={"question": "How does traversal work?"},
            ).json()
        self.assertNotIn("Invented", response["message"])

    def test_semantic_vector_fusion_is_real_and_falls_back(self):
        self.assertAlmostEqual(cosine([1, 0], [1, 0]), 1)
        self.assertEqual(cosine([1, 0], [0, 1]), 0)
        self.assertEqual(cosine([1], [1, 0]), 0)
        unit = store.rows(
            "SELECT * FROM units WHERE course_id=? LIMIT 1", ("data-structures",)
        )[0]
        store.execute(
            "INSERT OR REPLACE INTO vectors VALUES (?,?,?)",
            (unit["id"], "gemini-embedding-001", "[1,0]"),
        )
        with (
            patch.object(provider, "configured", return_value=True),
            patch.object(provider, "embed", return_value=[[1, 0]]),
        ):
            result = fuse("data-structures", "semantic paraphrase", [], 4)
        self.assertEqual(result[0]["id"], unit["id"])
        with (
            patch.object(provider, "configured", return_value=True),
            patch.object(
                provider, "embed", side_effect=provider.ProviderError("Unavailable")
            ),
        ):
            self.assertEqual(fuse("data-structures", "paraphrase", [unit], 4), [unit])
        store.execute("DELETE FROM vectors WHERE unit_id=?", (unit["id"],))

    def test_live_verifier_receives_only_each_claims_own_evidence(self):
        evidence = __import__("learnproof.tutoring", fromlist=["retrieve"]).retrieve(
            "data-structures", "How does traversal work?"
        )
        a, b = evidence[:2]
        calls = []

        def fake(prompt, *args, **kwargs):
            if not kwargs.get("verifier"):
                return {
                    "claims": [
                        {"text": "First claim", "source_ids": [a["id"]]},
                        {"text": "Second claim", "source_ids": [b["id"]]},
                    ]
                }
            calls.append(prompt)
            return {"supported": True}

        with (
            patch.object(provider, "configured", return_value=True),
            patch.object(provider, "generate", side_effect=fake),
        ):
            self.client.post(
                "/api/courses/data-structures/chat",
                json={"question": "How does traversal work?"},
            )
        self.assertEqual(len(calls), 2)
        self.assertIn(a["id"], calls[0])
        self.assertNotIn(b["id"], calls[0])
        self.assertIn(b["id"], calls[1])
        self.assertNotIn(a["id"], calls[1])


# Avoid running inherited tests twice; preserve only the fixture helpers.
for name in list(vars(api_fixture.ApiTests)):
    if name.startswith("test_"):
        setattr(SubmissionTests, name, None)

if __name__ == "__main__":
    unittest.main()
