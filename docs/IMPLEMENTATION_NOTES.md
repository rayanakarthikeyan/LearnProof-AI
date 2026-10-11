# Version 0.2 verification and limits

## Implemented

- React/TypeScript UI with six views and responsive navigation.
- FastAPI with course/profile creation, bounded raw uploads, source job states, citation endpoints, tutor chat, assessment and progress endpoints.
- Original six-page PDF and six-slide PPTX course packet generated on first launch; 20 authored MCQ/short-answer/numerical items checked against the sample notes cite real extracted pages.
- Local PDF rendering, slide text/image previews, BM25-style lexical retrieval, exact excerpt tutoring and off-material refusals.
- Server-only Gemini adapter, document vision, automatic timed video extraction with frame sampling, structured tutoring and an independent support check.
- Generated-item checking, bounded numerical arithmetic, prompt similarity rejection and unseen-item selection.
- Persistent learner events and Bayesian estimates; ambiguous short-answer grading leaves estimates unchanged.
- Wrong complexity response leads to a traversal diagnostic; an answered probe can lead to a different problem on the original topic. These are authored topic-level probes, not a validated misconception classifier.
- Optional Ragas runner; seeded simulator comparing three policies. Metrics are not filled in unless actually computed.

## Verified locally

20 Python unit/integration tests: actual PDF/PPTX extraction, valid preview pixels/locators, absent answer-key fields, scoped practice, duplicate submission rejection, persistent observations, profile isolation, numerical grading, ambiguous answer handling, local tutoring, refusal, invalid/fabricated provider citations, upload failures and no invented benchmark.

TypeScript/production build passes. npm audit reports zero vulnerabilities at the implementation check. Python dependency consistency passes. UI was inspected in the Codex browser; a Windows policy blocked standalone headless Edge, so the checked-in automated Playwright workflow is also run through Linux CI.

## Not verified live

No Gemini key was available during development. The provider adapter and responses are tested with injected outputs, but real visual interpretation, raw video understanding, generated items, semantic grading and Ragas have not been exercised against a live provider. A configured-model badge indicates configuration, not a successful provider health check.

LibreOffice is absent on the development host. Its optional render path needs a live check. The fallback slide preview can omit shapes/charts/animations; it is deliberately labeled approximate.

## Remaining scope

This iteration does not implement production authentication, hosted deployment, vector search, automatic subject-independent topic graphs, calibrated mastery parameters, comprehensive mock exams, region highlights, or a rigorous frozen multimodal benchmark. Do not claim full Track D compliance yet. The public source does not contain user uploads, local learner histories, API keys or the supplied planning PDFs.

The synthetic comparison uses explicitly declared learning assumptions and is not real student efficacy evidence. Fixed-order practice can outperform the adaptive policies under this simulator; report that result rather than tuning the simulator until the project wins.
