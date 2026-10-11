# LearnProof AI

**Find the gap. Teach with evidence. Check real understanding.**

Local web prototype for **Multimodal AI Hackathon 2026, Track D: Personalized Tutoring & Adaptive Learning**.

## The project

LearnProof turns lecture videos, textbooks and slide decks into a source-linked course library. When a student struggles, it asks a short diagnostic follow-up, identifies a *likely* prerequisite gap, teaches that concept using the original text and diagram, and gives an unseen transfer question. Every explanation can open its exact page, slide or video moment.

The defining demo is a **misconception repair loop**: wrong answer → diagnostic probe → cited visual explanation → different problem → updated mastery and next recommendation. A mastery estimate is not proof of learning; the unseen problem supplies observable evidence.

Start with **Data Structures: pointers, linked lists and operation complexity**. This matches the author's previous teaching-platform experience and provides diagrams, numerical questions and meaningful prerequisites in a small course.

## Current status

Version 0.2 includes a React interface, FastAPI service, SQLite persistence, actual document extraction/source previews, local cited tutoring, practice and learner histories. **It is an initial prototype, not yet a submission-ready implementation of every Track D requirement.**

| Capability | Status |
| --- | --- |
| PDF ingestion | Real per-page text extraction and original-page rendering; tested |
| PPTX ingestion | Text/images and approximate structural previews; tested. Full slide rendering uses optional LibreOffice when available; that branch is not locally verified |
| Video ingestion | Gemini Files API + timed segments + retained frame/video viewers implemented; requires a key and live verification |
| Visual interpretation | Gemini image-based extraction implemented; requires a key and live verification |
| Tutor | Local exact excerpts with lexical retrieval and boundary refusals; generated explanations and independent source-support checks implemented but not live verified |
| Assessments | 20 authored, reviewed sample items across MCQ, short-answer and numerical; generated-item verification implemented but not live verified |
| Personalization | Persistent scored attempts, BKT estimates, cold-start diagnostic, prerequisite follow-up and unseen transfer checks; parameters are illustrative |
| Source inspection | Actual page images, slide previews, original file links; timed video viewer implemented but not live verified |
| Evaluation | Ragas runner and development gold set included; no Ragas scores measured. Seeded policy simulation run and saved separately |
| Remaining track work | Hybrid/vector retrieval, automatic course-specific topic graphs, broader verified item banks/mock exams, richer misconception diagnostics, full multimodal live validation and frozen benchmarks |

## Run the web prototype

Prerequisites: Python 3.12 (tested), Node.js 20.19+ or 22.12+, and npm. Python packages are locked in `requirements.lock.txt`; frontend dependencies are locked in `package-lock.json`. No external database or API key is needed for local document/text mode.

```bash
git clone https://github.com/rayanakarthikeyan/LearnProof-AI.git
cd LearnProof-AI
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
# macOS/Linux: .venv/bin/python -m pip install -r requirements.lock.txt
npm ci
npm run dev:all
```

Open **http://127.0.0.1:5173**. The API runs at http://127.0.0.1:8000 (interactive API documentation: `/docs`). The launcher uses the project's `.venv`; set `LEARNPROOF_PYTHON` if using a different interpreter. Stop both with Ctrl+C.

The first launch creates two original, MIT-licensed sample documents and 20 authored practice items. Sample files go through actual local extraction and contain real source locators. Create an empty course to test fresh uploads. The topic taxonomy is currently fixed to six Data Structures concepts, even for newly named courses.

Files, profiles, chats, attempts and estimates persist under ignored `.local-data/`. `LEARNPROOF_DATA_DIR` can change this location. Learning profiles separate local histories; they are **not authenticated accounts**. Keep the API on loopback; public deployment needs authentication, per-user authorization, durable workers/storage and further hardening.

### Enable multimodal AI

Copy `.env.example` to `.env`, set server-only `GEMINI_API_KEY`, optionally change `GEMINI_MODEL` and `GEMINI_VERIFIER_MODEL`, then restart the API. The default model ID comes from Google's current model guide; availability/quota depends on your account. Never put a key in the frontend or commit `.env`.

In AI mode, uploaded document pages and lectures are sent to Gemini. Local mode sends no course material to an AI provider. Missing keys and provider failures are visible errors, never fabricated responses. Video limits: 100 MB, 10 minutes and 40 extracted intervals. PDF limit: 25 MB / 80 pages; slide limit: 25 MB / 60 slides. Numeric timestamp bounds are checked, but semantic alignment must still be inspected.

For faithful slide rendering, install LibreOffice and make `soffice` available on PATH. Without it, the app visibly labels the preview approximate: shapes/charts/animations can be missing. This fallback is not equivalent to complete diagram extraction.

### Check the build

```bash
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
npm run build
npm audit --audit-level=high
npx playwright install chromium --only-shell
# With npm run dev:all already running:
npm run test:ui
```

On macOS/Linux use `.venv/bin/python`. `PLAYWRIGHT_CHANNEL=msedge` or `chrome` may use an installed browser if the host permits launching it; otherwise install Playwright Chromium. The automated browser script creates a separate local verification profile. GitHub Actions runs the API tests, build, audit and browser workflows on Linux.

The older deterministic starter remains available with `python -m learnproof.demo`; its fixture IDs are illustrative and separate from the web app's actual source citations.

### Evaluation

```bash
.\.venv\Scripts\python.exe -m learnproof.simulate --seeds 30
.\.venv\Scripts\python.exe -m pip install -r requirements-evaluation.txt
.\.venv\Scripts\python.exe -m learnproof.evaluate --gold evaluation/gold.sample.jsonl
```

Ragas requires a configured provider and optional evaluation packages. The included 10-case gold set is a development smoke set, not the final frozen multimodal benchmark. Measured outputs go to `.local-data/evaluation/`; the UI shows dashes until a real report exists. The simulation report in `evaluation/simulation.baseline.json` compares fixed-order, mastery-only and prerequisite policies across 30 seeds and three profiles. It models concept events, not question repetition or real educational efficacy, and does not establish that the adaptive policy outperforms fixed practice.

## Read the plan

- [Analysis and recommendation](docs/PROJECT_ANALYSIS.md): both supplied PDFs, previous repositories, rejected alternatives and positioning.
- [Track requirements](docs/TRACK_REQUIREMENTS.md): mandatory scope and judging weights.
- [Architecture](docs/ARCHITECTURE.md): ingestion, citations, verification and learner model.
- [Implementation roadmap](docs/ROADMAP.md): deliverables and an illustrative 48-hour schedule.
- [Evaluation protocol](docs/EVALUATION.md): framework metrics, ablations and honest reporting.
- [Demo and submission](docs/DEMO_AND_SUBMISSION.md): six-minute narrative and submission checklist.

## What gives it a competitive case

The official rubric assigns 20% to grounding, 20% to personalization and 15% to evaluation. Build visible evidence for those criteria: citations that actually open, different paths for different learners, and reproducible benchmark runs. Diagram understanding should be central, since it is a requirement rather than an optional polish feature. No project concept can guarantee first or second place.

## Implementation and design direction

React/TypeScript/Vite frontend; Python/FastAPI service; SQLite and local files for this first iteration; pdfplumber/python-pptx for local extraction; Gemini for optional visual/video processing; Ragas for optional evaluation. Lexical retrieval uses BM25-style ranking with a small domain synonym map. PostgreSQL/vector search, object storage and durable ingestion workers remain the deployment direction. Background ingestion currently runs inside the API process; interrupted jobs are marked failed on restart and can be retried.

Original starter code and documentation: MIT licensed. Do not assume uploaded textbooks, lecture videos, or previous repositories share this license. The supplied planning PDFs are intentionally not redistributed here.

Author: **rayanakarthikeyan**. Git commit email: **rayanakarthikeyan@gmail.com**.
