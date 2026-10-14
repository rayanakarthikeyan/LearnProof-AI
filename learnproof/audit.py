"""Programmatic source/retrieval audit, separate from semantic Ragas metrics."""

import argparse
import json
import math
import re
import time
from datetime import datetime, timezone
from pathlib import Path

from . import tutoring
from .store import DATA, initialize, rows


def normalized(text):
    return re.sub(r"\s+", " ", text).strip()


def run(course, gold_path):
    gold = [
        json.loads(line)
        for line in Path(gold_path).read_text(encoding="utf-8-sig").splitlines()
        if line.strip()
    ]
    units = rows(
        "SELECT u.*,s.name AS source_name FROM units u JOIN sources s ON s.id=u.source_id WHERE u.course_id=? AND s.status='indexed'",
        (course,),
    )
    if not gold or not units:
        raise ValueError("Gold questions and indexed sources are required.")
    cases = []
    started = time.monotonic()
    for item in gold:
        expected = {
            u["id"]
            for u in units
            if any(
                u["source_name"] == loc["source_name"]
                and (
                    u["page"] == loc.get("page")
                    if "page" in loc
                    else u["start"] is not None
                    and u["start"] <= loc["seconds"] <= u["end"]
                )
                for loc in item["locations"]
            )
        }
        if not item["off_material"] and not expected:
            raise ValueError(
                "Gold source location did not resolve: " + item["question"]
            )
        retrieved = tutoring.retrieve(course, item["question"])
        # Audit the offline mode explicitly even if a key is configured; no provider calls.
        from unittest.mock import patch

        with patch("learnproof.provider.configured", return_value=False):
            result = tutoring.answer(course, item["question"])
        hit = any(u["id"] in expected for u in retrieved)
        locators = all(
            any(
                u["id"] == c["id"]
                and u["source_id"] == c["source_id"]
                and u["page"] == c["page"]
                and u["start"] == c["start"]
                for u in units
            )
            for c in result["citations"]
        )
        quotes = all(
            any(
                normalized(claim["text"]) in normalized(u["text"])
                for u in units
                if u["id"] in claim["source_ids"]
            )
            for claim in result["claims"]
        )
        cases.append(
            {
                "question": item["question"],
                "off_material": item["off_material"],
                "expected_ids": sorted(expected),
                "retrieved_ids": [u["id"] for u in retrieved],
                "source_hit": hit,
                "refused": result["status"] == "unsupported",
                "locator_valid": locators,
                "quote_integrity": quotes,
                "claim_count": len(result["claims"]),
            }
        )
    answerable = [c for c in cases if not c["off_material"]]
    off = [c for c in cases if c["off_material"]]
    claims = [c for c in cases if c["claim_count"]]
    ratio = lambda n, d: n / d if d else None
    report = {
        "status": "measured-programmatic",
        "mode": "local-excerpts",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "course": course,
        "gold_path": str(gold_path),
        "case_count": len(cases),
        "answerable_count": len(answerable),
        "off_material_count": len(off),
        "metrics": {
            "source_hit_at_4": ratio(
                sum(c["source_hit"] for c in answerable), len(answerable)
            ),
            "off_material_refusal_rate": ratio(
                sum(c["refused"] for c in off), len(off)
            ),
            "answerable_false_refusal_rate": ratio(
                sum(c["refused"] for c in answerable), len(answerable)
            ),
            "locator_validity": ratio(
                sum(c["locator_valid"] for c in claims), len(claims)
            ),
            "quote_integrity": ratio(
                sum(c["quote_integrity"] for c in claims), len(claims)
            ),
        },
        "duration_seconds": time.monotonic() - started,
        "cases": cases,
        "limits": "Programmatic locator/exact-quote/retrieval checks only. Not semantic faithfulness, answer relevancy, real learning efficacy or a substitute for Ragas. Source-hit uses strict annotated locations.",
    }
    return report


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--course", default="data-structures")
    p.add_argument("--gold", default="evaluation/gold.sample.jsonl")
    p.add_argument("--output", default="evaluation/programmatic.baseline.json")
    args = p.parse_args()
    initialize()
    report = run(args.course, args.gold)
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    local = DATA / "evaluation"
    local.mkdir(parents=True, exist_ok=True)
    (local / f"{args.course}-audit.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in report.items() if k != "cases"}, indent=2))


if __name__ == "__main__":
    main()
