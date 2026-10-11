# Implementation roadmap

The event duration, team size and deadline were not supplied. The schedule below is an illustrative 48-hour plan, not a confirmed event schedule. For a solo build, use the same sequence with a smaller course packet and more time; do not remove mandatory modalities or evaluation to add optional features.

## Deliverable sequence

| Window | Deliverable | Exit check |
| --- | --- | --- |
| Hours 0–4 | Freeze course scope, create licensed/authored course packet, label gold sources | One PDF, PPTX, MP4; 6–8 concepts; annotation sheet |
| Hours 4–14 | Automatic ingestion, visual extraction and source viewer | New raw upload indexes; page/slide/time locators open correctly |
| Hours 14–22 | Grounded chat and refusals | Supported answer opens evidence; off-material query refuses |
| Hours 22–30 | Verified assessment formats, attempt store and BKT | MCQ/short/numerical work; incorrect response has cited feedback |
| Hours 30–36 | Diagnostic repair flow and learner dashboard | Two learner profiles receive meaningfully different next steps |
| Hours 36–42 | Ragas and learner simulations; fix failures | Raw outputs, baseline comparison and failure analysis saved |
| Hours 42–48 | UX, clean-clone verification, video and Devpost | Complete required submission components and final rehearsal |

If a 2–4 person team is available, divide frontend/source viewers, ingestion/retrieval, assessments/learner model, and evaluation/demo. A single end-to-end feature should integrate early; separate impressive screens are insufficient.

## Build priority

1. Vertical slice: raw files → source units → cited answer → actual viewer.
2. Assessment slice: selected scope → generated item → verification → response → cited feedback.
3. Personalization slice: diagnostic → hypothesis → probe → prerequisite lesson → transfer check.
4. Evaluation slice: frozen references → raw runs → metric report → failure fixes.
5. Optional Telugu/English explanation, only with fluent review and preserved evidence links.

Defer faculty/admin portals, proctoring, plagiarism scanning, full coding IDEs, general scheduling, subscriptions and support for every subject. Prior projects already show portal-building experience; this submission should spend its effort on the challenge's multimodal learning loop.

## Definition of submission-ready

- All mandatory rows in TRACK_REQUIREMENTS have working evidence.
- Ingestion supports fresh raw files; preloaded demo data is separately labeled.
- Citations open the actual source at the relevant location.
- At least one question requires understanding a figure, not only its caption.
- Each assessment format has rejected-item and correctness checks.
- Multiple sessions persist learner state and avoid repeated items.
- Conversational check responses update mastery with logged scored evidence.
- Ragas metrics and simulated personalization results are measured and reproducible.
- README contains exact dependency versions, provider configuration and real application run commands.
- The public repository contains no credentials or unauthorized course/student data.
- Devpost and video are complete before the organizer's verified deadline.
