# LearnProof AI

**Find the gap. Teach with evidence. Check real understanding.**

Hackathon project proposal and executable learner-model starter for **Multimodal AI Hackathon 2026, Track D: Personalized Tutoring & Adaptive Learning**.

## The project

LearnProof turns lecture videos, textbooks and slide decks into a source-linked course library. When a student struggles, it asks a short diagnostic follow-up, identifies a *likely* prerequisite gap, teaches that concept using the original text and diagram, and gives an unseen transfer question. Every explanation can open its exact page, slide or video moment.

The defining demo is a **misconception repair loop**: wrong answer → diagnostic probe → cited visual explanation → different problem → updated mastery and next recommendation. A mastery estimate is not proof of learning; the unseen problem supplies observable evidence.

Start with **Data Structures: pointers, linked lists and operation complexity**. This matches the author's previous teaching-platform experience and provides diagrams, numerical questions and meaningful prerequisites in a small course.

## Current status

This repository contains an analyzed proposal, architecture, rubric mapping, implementation plan, evaluation protocol, submission script and a small deterministic Python starter. **It is not yet the working multimodal web prototype required for submission.**

| Capability | Status |
| --- | --- |
| Bayesian knowledge tracing update | Implemented, unit tested; illustrative parameters |
| Prerequisite-aware recommendation | Implemented for a tiny authored graph |
| Unseen, verified-question selection | Implemented for an authored fixture bank |
| PDF/PPTX/video ingestion and visual extraction | Planned |
| Grounded tutor and working source viewers | Planned |
| MCQ, short-answer and numerical generation/verification | Planned |
| Web dashboard, persistent learner histories | Planned |
| Ragas evaluation and simulated-profile comparison | Protocol only; results not measured |

## Run the starter

Prerequisite: Python 3.11 or later. No packages, API keys or database are needed for this starter.

```bash
git clone https://github.com/rayanakarthikeyan/LearnProof-AI.git
cd LearnProof-AI
python -m learnproof.demo
python -m unittest discover -s tests -v
```

The demo starts with a wrong complexity answer, selects a weak prerequisite for practice, updates that prerequisite after a correct response, and selects a different verified question. Printed estimates are computed from scripted observations, not measured student gains. Source IDs in the fixture bank are placeholders, not citations to uploaded material.

## Read the plan

- [Analysis and recommendation](docs/PROJECT_ANALYSIS.md): both supplied PDFs, previous repositories, rejected alternatives and positioning.
- [Track requirements](docs/TRACK_REQUIREMENTS.md): mandatory scope and judging weights.
- [Architecture](docs/ARCHITECTURE.md): ingestion, citations, verification and learner model.
- [Implementation roadmap](docs/ROADMAP.md): deliverables and an illustrative 48-hour schedule.
- [Evaluation protocol](docs/EVALUATION.md): framework metrics, ablations and honest reporting.
- [Demo and submission](docs/DEMO_AND_SUBMISSION.md): six-minute narrative and submission checklist.

## What gives it a competitive case

The official rubric assigns 20% to grounding, 20% to personalization and 15% to evaluation. Build visible evidence for those criteria: citations that actually open, different paths for different learners, and reproducible benchmark runs. Diagram understanding should be central, since it is a requirement rather than an optional polish feature. No project concept can guarantee first or second place.

## Proposed implementation dependencies

React/TypeScript frontend; Python API and ingestion worker; PostgreSQL with vector search and object storage; a configurable multimodal model for document/video understanding; Ragas for evaluation. These are design choices, not installed dependencies. Pin versions and document actual commands when these components are implemented. Provider keys must stay on the server.

Original starter code and documentation: MIT licensed. Do not assume uploaded textbooks, lecture videos, or previous repositories share this license. The supplied planning PDFs are intentionally not redistributed here.

Author: **rayanakarthikeyan**. Git commit email: **rayanakarthikeyan@gmail.com**.
