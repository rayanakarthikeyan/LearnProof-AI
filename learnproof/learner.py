"""Transparent illustrative BKT and prerequisite-aware practice selection."""

from dataclasses import dataclass
import math
from typing import Mapping, Sequence


def _probability(value: float) -> None:
    if not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError("Probabilities must be finite and in [0, 1].")


def update_mastery(
    prior: float,
    correct: bool,
    *,
    slip: float = 0.1,
    guess: float = 0.2,
    learning: float = 0.1,
) -> float:
    """Update only from a scored observation; parameters are not calibrated."""
    for value in (prior, slip, guess, learning):
        _probability(value)
    if type(correct) is not bool:
        raise ValueError("A scored observation must be a boolean.")
    known = prior * ((1 - slip) if correct else slip)
    unknown = (1 - prior) * (guess if correct else (1 - guess))
    if known + unknown == 0:
        raise ValueError("Observation is impossible under these parameters.")
    posterior = known / (known + unknown)
    return posterior + (1 - posterior) * learning


@dataclass(frozen=True)
class Question:
    id: str
    concept: str
    difficulty: int
    verified: bool
    source_unit_id: str


def next_concept(
    target: str,
    prerequisites: Mapping[str, Sequence[str]],
    mastery: Mapping[str, float],
    threshold: float = 0.7,
) -> str:
    """Choose the weakest unmastered ancestor; graph edges must be acyclic."""
    _probability(threshold)
    for value in mastery.values():
        _probability(value)
    ancestors: set[str] = set()
    active: set[str] = set()
    visited: set[str] = set()

    def visit(concept: str) -> None:
        if concept in active:
            raise ValueError("Prerequisite graph contains a cycle.")
        if concept in visited:
            return
        active.add(concept)
        for parent in prerequisites.get(concept, ()):
            ancestors.add(parent)
            visit(parent)
        active.remove(concept)
        visited.add(concept)

    visit(target)
    weak = [c for c in ancestors if mastery.get(c, 0.3) < threshold]
    return min(weak, key=lambda c: (mastery.get(c, 0.3), c)) if weak else target


def select_question(
    bank: Sequence[Question], concept: str, mastery: float, seen: set[str]
) -> Question | None:
    """Never repeat IDs or deliver unverified/missing-source items.

    Semantic deduplication and real evidence resolution are future work.
    """
    _probability(mastery)
    level = 1 if mastery < 0.4 else 2 if mastery < 0.7 else 3
    candidates = [
        q
        for q in bank
        if q.concept == concept and q.verified and q.source_unit_id and q.id not in seen
    ]
    return min(
        candidates, key=lambda q: (abs(q.difficulty - level), q.id), default=None
    )
