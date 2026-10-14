"""Package committed source with a truthful, local submission evidence report."""

import argparse
import json
import subprocess
from pathlib import Path
from .store import initialize
from .readiness import report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--course", default="data-structures")
    parser.add_argument("--output", default="output/submission")
    args = parser.parse_args()
    git = lambda *a: subprocess.check_output(
        ["git", *a], text=True, encoding="utf-8"
    ).strip()
    if git("status", "--porcelain"):
        parser.error(
            "Commit the source changes before packaging. No stale source archive was created."
        )
    for line in git("log", "--format=%H|%ae|%ce").splitlines():
        sha, author, committer = line.split("|")
        if (
            author != "rayanakarthikeyan@gmail.com"
            or committer != "rayanakarthikeyan@gmail.com"
        ):
            parser.error("Commit email policy failed: " + sha)
    tracked = git("ls-files").splitlines()
    if any(
        name == ".env" or name.startswith((".local-data/", ".venv", "node_modules/"))
        for name in tracked
    ):
        parser.error("Private/runtime data is tracked; fix this before packaging.")
    sha = git("rev-parse", "HEAD")
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "git",
            "archive",
            "--format=zip",
            "--prefix=LearnProof-AI/",
            "-o",
            str(output / "LearnProof-AI-source.zip"),
            "HEAD",
        ],
        check=True,
    )
    initialize()
    readiness = report(args.course)
    readiness["commit"] = sha
    readiness["repository"] = "https://github.com/rayanakarthikeyan/LearnProof-AI"
    (output / "submission-evidence.json").write_text(
        json.dumps(readiness, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    lines = [
        "# LearnProof submission evidence",
        "",
        f"Source commit: `{sha}`",
        "",
        "Repository: https://github.com/rayanakarthikeyan/LearnProof-AI",
        "",
        "Author and committer email verified for all commits: rayanakarthikeyan@gmail.com",
        "",
        "## Evidence checks",
        "",
    ]
    for check in readiness["checks"]:
        lines.append(
            f"- {'PASS' if check['passed'] else 'PENDING'} — {check['label']}: {check['detail']}"
        )
    lines += ["", "## Required external deliverables", ""] + [
        f"- {item}" for item in readiness["external_deliverables"]
    ]
    lines += [
        "",
        readiness["note"],
        "",
        "This source ZIP excludes Git metadata, ignored credentials, learner data and local environments. It does not claim the remaining live checks or external deliverables are complete.",
    ]
    (output / "SUBMISSION_EVIDENCE.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "commit": sha,
                "source_zip": str(output / "LearnProof-AI-source.zip"),
                "technical_checks_ready": readiness["ready"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
