"""Live integration check using only the repository's original course fixtures."""

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from . import assessment, provider, tutoring
from .config import load_environment
from .ingestion import ingest, register
from .store import DATA, execute, initialize, rows, course_concepts


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--course", default="submission-validation")
    args = p.parse_args()
    load_environment()
    if not provider.configured():
        p.error("Configure GEMINI_API_KEY locally first. No live check was run.")
    initialize()
    execute(
        "INSERT OR IGNORE INTO courses VALUES (?,?)",
        (args.course, "Submission validation · original fixtures"),
    )
    from .sample import create_packet

    book, _ = create_packet(DATA / "validation-sample")
    fixtures = [
        (book, "Foundations · authored course notes", False),
        (
            Path("demo-materials/linked-list-evidence.pdf"),
            "linked-list-evidence.pdf",
            True,
        ),
        (
            Path("demo-materials/linked-list-evidence.pptx"),
            "linked-list-evidence.pptx",
            True,
        ),
        (
            Path("demo-materials/linked-list-lecture.mp4"),
            "linked-list-lecture.mp4",
            True,
        ),
    ]
    sources = []
    for path, name, use_ai in fixtures:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        existing = rows(
            "SELECT * FROM sources WHERE course_id=? AND hash=? AND status='indexed'",
            (args.course, digest),
        )
        id = existing[0]["id"] if existing else register(path, args.course, name=name)
        if not existing:
            ingest(id, use_ai=use_ai)
        source = rows("SELECT * FROM sources WHERE id=?", (id,))[0]
        sources.append(
            {
                "name": name,
                "hash": digest,
                "status": source["status"],
                "error": source["error"],
                "units": len(rows("SELECT id FROM units WHERE source_id=?", (id,))),
            }
        )
        print(
            json.dumps(
                {
                    "source": name,
                    "status": source["status"],
                    "units": sources[-1]["units"],
                }
            )
        )
        if source["status"] != "indexed":
            raise RuntimeError(
                source["error"]
                or "Live ingestion failed; no success report was written."
            )
    response = tutoring.answer(
        args.course,
        "In the original first linked-list diagram, which value follows 11?",
    )
    concepts = course_concepts(args.course)
    target = next(
        (
            id
            for id, m in concepts.items()
            if "complex" in (id + " " + m["name"]).lower()
        ),
        next(iter(concepts)),
    )
    for kind in ["mcq", "short", "numerical"]:
        assessment.generate_items(args.course, target, kind)
    formats = {
        q["kind"]
        for q in rows("SELECT kind FROM questions WHERE course_id=?", (args.course,))
    }
    result = {
        "status": "passed"
        if response["status"] == "answered" and {"mcq", "short", "numerical"} <= formats
        else "partial",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "course": args.course,
        "model": provider.model_name(),
        "verifier_model": provider.model_name(True),
        "sources": sources,
        "tutor_response": response,
        "verified_formats": sorted(formats),
        "limits": "Live integration check on original fixtures. Not a full benchmark or proof of educational efficacy. Inspect visual readings and video alignment; run the 60-case Ragas set separately.",
    }
    destination = DATA / "verification"
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "live.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "status": result["status"],
                "course": args.course,
                "verified_formats": sorted(formats),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
