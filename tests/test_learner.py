import unittest

from learnproof.learner import Question, next_concept, select_question, update_mastery


class LearnerTests(unittest.TestCase):
    def test_bkt_known_values(self):
        self.assertAlmostEqual(update_mastery(0.5, True), 0.8363636363636364)
        self.assertAlmostEqual(update_mastery(0.5, False), 0.2)

    def test_invalid_and_impossible_observations(self):
        for value in (-0.1, 1.1, float("nan")):
            with self.assertRaises(ValueError):
                update_mastery(value, True)
        with self.assertRaises(ValueError):
            update_mastery(0, True, guess=0)
        with self.assertRaises(ValueError):
            update_mastery(0.5, "correct")

    def test_prerequisites_and_distinct_profiles(self):
        graph = {"cost": ("traversal",), "traversal": ("pointers",)}
        self.assertEqual(
            next_concept("cost", graph, {"pointers": 0.1, "traversal": 0.3}), "pointers"
        )
        self.assertEqual(
            next_concept("cost", graph, {"pointers": 0.9, "traversal": 0.8}), "cost"
        )

    def test_cycle_rejected(self):
        with self.assertRaises(ValueError):
            next_concept("a", {"a": ("b",), "b": ("a",)}, {})

    def test_shared_ancestor_is_not_a_cycle(self):
        graph = {"a": ("b", "c"), "b": ("d",), "c": ("d",)}
        self.assertEqual(next_concept("a", graph, {"d": 0.1}), "d")

    def test_seen_unverified_and_missing_source_are_excluded(self):
        bank = [
            Question("seen", "x", 1, True, "s1"),
            Question("bad", "x", 1, False, "s1"),
            Question("no-source", "x", 1, True, ""),
            Question("fresh", "x", 2, True, "s2"),
        ]
        selected = select_question(bank, "x", 0.3, {"seen"})
        self.assertEqual(selected.id, "fresh")
        self.assertIsNone(select_question(bank, "x", 0.3, {"seen", "fresh"}))

    def test_difficulty_tracks_estimate(self):
        bank = [Question(str(i), "x", i, True, "s") for i in (1, 2, 3)]
        self.assertEqual(select_question(bank, "x", 0.2, set()).difficulty, 1)
        self.assertEqual(select_question(bank, "x", 0.8, set()).difficulty, 3)


if __name__ == "__main__":
    unittest.main()
