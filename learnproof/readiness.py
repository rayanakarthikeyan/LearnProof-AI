"""Evidence-backed repository/application readiness; never implies submission completion."""

import json
from pathlib import Path
from .store import DATA, course_concepts, rows


def report(course):
    sources = rows("SELECT * FROM sources WHERE course_id=?", (course,))
    indexed = [s for s in sources if s["status"] == "indexed"]
    kinds = {s["kind"] for s in indexed}
    units = rows("SELECT * FROM units WHERE course_id=?", (course,))
    formats = {
        q["kind"]
        for q in rows("SELECT kind FROM questions WHERE course_id=?", (course,))
    }
    framework = DATA / "evaluation" / f"{course}.json"
    framework_report = (
        json.loads(framework.read_text(encoding="utf-8"))
        if framework.exists()
        else None
    )
    audit = DATA / "evaluation" / f"{course}-audit.json"
    audit_report = (
        json.loads(audit.read_text(encoding="utf-8")) if audit.exists() else None
    )
    checks = [
        {
            "id": "raw-media",
            "label": "Raw PDF, slides and video indexed",
            "passed": {"pdf", "pptx"} <= kinds and bool(kinds & {"mp4", "webm"}),
            "detail": ", ".join(sorted(kinds)) or "No indexed material",
        },
        {
            "id": "visual",
            "label": "Visual information extracted",
            "passed": any(
                u["visual"] and u["extraction"].startswith("gemini") for u in units
            ),
            "detail": "Requires actual vision extraction, not just a displayed picture",
        },
        {
            "id": "topics",
            "label": "Course-specific concept graph",
            "passed": bool(course_concepts(course)),
            "detail": "Suggested prerequisites remain labeled as inferred",
        },
        {
            "id": "formats",
            "label": "All three assessment formats available",
            "passed": {"mcq", "short", "numerical"} <= formats,
            "detail": ", ".join(sorted(formats)) or "No verified items",
        },
        {
            "id": "ragas",
            "label": "Framework metrics measured",
            "passed": bool(
                framework_report and framework_report.get("status") == "measured"
            ),
            "detail": "Live Ragas metrics, distinct from programmatic checks",
        },
        {
            "id": "source-audit",
            "label": "Programmatic source audit run",
            "passed": bool(audit_report),
            "detail": "Locator, quote and retrieval checks; not semantic efficacy",
        },
    ]
    return {
        "course": course,
        "checks": checks,
        "ragas": framework_report,
        "programmatic": audit_report,
        "ready": all(c["passed"] for c in checks),
        "external_deliverables": [
            "Record/upload a 3–10 minute YouTube system demo with English audio/subtitles",
            "Complete Devpost description and add real-name team members",
            "Verify organizer deadline and prior-work eligibility",
        ],
        "note": "Technical checks do not establish educational efficacy or completion of Devpost/video submission.",
    }
