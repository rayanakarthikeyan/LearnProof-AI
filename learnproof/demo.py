"""Run an authored observation sequence; no provider or source ingestion."""

from .learner import Question, next_concept, select_question, update_mastery


def main() -> None:
    print("LearnProof learner starter — scripted fixture, not a live AI tutor")
    graph = {"insertion-cost": ("traversal",), "traversal": ("pointers",)}
    state = {"pointers": 0.8, "traversal": 0.3, "insertion-cost": 0.5}
    bank = [Question("traverse-1", "traversal", 1, True, "fixture-slide-3"),
            Question("traverse-2", "traversal", 2, True, "fixture-page-2")]
    state["insertion-cost"] = update_mastery(state["insertion-cost"], False)
    concept = next_concept("insertion-cost", graph, state)
    first = select_question(bank, concept, state[concept], set())
    print(f"Wrong insertion-cost observation; next prerequisite: {concept}")
    print(f"First authored practice item: {first.id}")
    state[concept] = update_mastery(state[concept], True)
    second = select_question(bank, concept, state[concept], {first.id})
    print(f"After scripted correct observation, estimate: {state[concept]:.3f}")
    print(f"Unseen item: {second.id}")
    print("Estimates are illustrative; fixture source IDs are placeholders.")


if __name__ == "__main__":
    main()
