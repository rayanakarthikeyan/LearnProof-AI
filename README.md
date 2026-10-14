# LearnProof AI

**Find the gap. Teach with evidence. Check real understanding.**

Submission-candidate web application for **Multimodal AI Hackathon 2026, Track D: Personalized Tutoring & Adaptive Learning**.

## The project

LearnProof turns lecture videos, textbooks and slide decks into a source-linked course library. When a student struggles, it asks a short diagnostic follow-up, identifies a *likely* prerequisite gap, teaches that concept using the original text and diagram, and gives an unseen transfer question. Every explanation can open its exact page, slide or video moment.

The defining demo is a **misconception repair loop**: wrong answer → diagnostic probe → cited visual explanation → different problem → updated mastery and next recommendation. A mastery estimate is not proof of learning; the unseen problem supplies observable evidence.

Start with **Data Structures: pointers, linked lists and operation complexity**. This matches the author's previous teaching-platform experience and provides diagrams, numerical questions and meaningful prerequisites in a small course.

## Current status

Version 0.3 adds course-specific concept suggestions, resumable diagnostic repair, scoped mock exams, cited revision, optional semantic retrieval, original raw-media fixtures and measured programmatic checks. **Live multimodal/Ragas validation and the Devpost/YouTube deliverables remain pending; do not claim final submission completion yet.**

| Capability | Status |
| --- | --- |
| PDF ingestion | Real per-page text extraction and original-page rendering; tested |
| PPTX ingestion | Text/images and approximate structural previews; tested. Full slide rendering uses optional LibreOffice when available; that branch is not locally verified |
| Video ingestion | Gemini Files API + timed segments + retained frame/video viewers implemented; requires a key and live verification |
| Visual interpretation | Gemini image-based extraction implemented; requires a key and live verification |
| Tutor | Local exact excerpts with lexical retrieval and boundary refusals; generated explanations and independent source-support checks implemented but not live verified |
| Assessments | 20 authored items across three formats; scoped mock exams and cited reports; stricter generated-item verification implemented but not live verified |
| Personalization | Persistent attempts and repair state, BKT, course-specific graphs, conversational checks and unseen transfer; parameters are illustrative |
| Source inspection | Actual page images, slide previews, original file links; timed video viewer implemented but not live verified |
| Evaluation | 30-case programmatic audit measured; versioned 60-case multimodal gold set; compatible Ragas stack import-checked; no live Ragas scores measured |
| Remaining track work | Live semantic/visual/video verification, 60-case framework run, source-fidelity inspection, real efficacy/calibration and required external submission deliverables |

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

The first launch creates two original, MIT-licensed sample documents and 20 authored practice items. Sample files go through actual local extraction and contain real source locators. Create an empty course to test fresh uploads. The sample has an authored six-concept graph. Other courses receive topics suggested from their extracted content; AI-derived prerequisite edges are grounded to source units, checked for cycles and labeled tentative.

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
.\.venv\Scripts\python.exe -m pip install -r requirements-evaluation.lock.txt
.\.venv\Scripts\python.exe -m learnproof.evaluate --gold evaluation/gold.sample.jsonl
```

Ragas requires a configured provider and optional evaluation packages. The 10-case smoke set is retained for quick checks. The versioned `gold.multimodal.jsonl` has 60 reference cases (20 text, 15 figures, 15 video, 10 off-material); `gold.text.jsonl` has a separately measured 30-case local subset. Measured outputs go to `.local-data/evaluation/`; the UI shows dashes until a real report exists. The simulation report in `evaluation/simulation.baseline.json` compares fixed-order, mastery-only and prerequisite policies across 30 seeds and three profiles. It models concept events, not question repetition or real educational efficacy, and does not establish that the adaptive policy outperforms fixed practice.

## Judge quick start and submission evidence

1. Run the app, open the source library, ask a cited question and inspect its actual source.
2. In Practice & repair, choose Operation complexity with prerequisite routing off. Answer the first misconception item incorrectly, follow the traversal probe, reload to verify persistence, then try the unseen transfer question.
3. Create a scoped Mock exam. Inspect its cited feedback report and separate correct, incorrect and unscored responses.
4. Open My understanding for the concept map and source-linked revision; open Evaluation for the measured programmatic audit and pending live checks.
5. With a server key configured, upload the three original files under `demo-materials/` or run `python -m learnproof.validate_live`. No transcript or extracted chunk file is supplied to ingestion.

The 30-case local audit reports source hit@4 **95%**, off-material refusal **100%**, answerable false refusal **5%**, locator validity **100%** and exact-quote integrity **100%**. These are programmatic checks on authored references, not semantic faithfulness, answer relevancy or student learning gains. The raw cases and limits are retained in `evaluation/programmatic.baseline.json`.

For the full framework run, use an isolated evaluation environment installed from `requirements-evaluation.lock.txt`:

```bash
python -m learnproof.validate_live
python -m learnproof.evaluate --course submission-validation --gold evaluation/gold.multimodal.jsonl
```

Use the appropriate virtual environment's Python executable. The live validator uses only the repository's original fixtures in a separate course. It refuses to claim success without actual provider requests. Ragas telemetry/tracing is disabled by the runner.

### Container preview

```bash
docker build -t learnproof-ai .
docker volume create learnproof-data
docker run --rm -p 127.0.0.1:8000:8000 --env-file .env -v learnproof-data:/data learnproof-ai
```

Open http://127.0.0.1:8000. The container serves the built UI and API in one process and includes LibreOffice. The binding is local; it does not add production authentication. The Docker build is checked by CI; see the exact run result before claiming deployment verification.

### Package the committed submission source

```bash
python -m learnproof.release
```

A clean committed tree is required. This writes an ignored source ZIP and a factual evidence report under `output/submission/`. All commit author/committer emails are checked. Private `.env`, local histories and environments are excluded.

Read [submission readiness](docs/SUBMISSION_READINESS.md), [Devpost draft](docs/DEVPOST_DRAFT.md), and [third-party notices](docs/THIRD_PARTY_NOTICES.md) before publishing the final project page. The narrated source clip is not the required 3–10 minute working-system YouTube demo.

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

React/TypeScript/Vite frontend; Python/FastAPI service; SQLite and local files for this first iteration; pdfplumber/python-pptx for local extraction; Gemini for optional visual/video processing; Ragas for optional evaluation. Retrieval combines BM25-style lexical ranking with optional real Gemini embeddings through reciprocal-rank fusion. Raw AI ingestion builds semantic vectors; without a key/index the explicit fallback is lexical retrieval. PostgreSQL/vector search, object storage and durable ingestion workers remain the deployment direction. Background ingestion currently runs inside the API process; interrupted jobs are marked failed on restart and can be retried.

Original starter code and documentation: MIT licensed. Do not assume uploaded textbooks, lecture videos, or previous repositories share this license. The supplied planning PDFs are intentionally not redistributed here.

Author: **rayanakarthikeyan**. Git commit email: **rayanakarthikeyan@gmail.com**.
