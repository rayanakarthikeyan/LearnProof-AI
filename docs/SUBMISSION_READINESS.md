# Final submission readiness — version 0.3

This is a factual handover, not a claim that Devpost submission is complete.

## Implemented and checked without an API key

- Raw PDF/PPTX upload, source preservation, local text extraction and actual source images.
- Course-specific suggested topics; validated prerequisite DAGs; an authored Data Structures sample graph.
- Cited local excerpts, source boundaries and actual page/slide opening.
- All three assessment formats, scoped mock exams, cited post-exam reports, profile isolation and repetition exclusion across reserved exams and submitted practice.
- Persistent diagnostic → prerequisite probe → unseen transfer workflow. Its state and scored feedback survive reloads.
- Per-topic Bayesian estimates, conversational checks and source-linked weak-topic revision.
- A visible concept map and evidence checklist, locally bundled fonts and responsive views.
- Programmatic source/retrieval audit, seeded policy comparisons, regression/CI checks and commit-email enforcement.

## Live AI checks still required

Configure `GEMINI_API_KEY` in the ignored `.env`, then run:

```powershell
.\.venv\Scripts\python.exe -m learnproof.validate_live
.\.venv-eval-checked\Scripts\python.exe -m learnproof.evaluate --course submission-validation --gold evaluation/gold.multimodal.jsonl
```

For a new machine, create an evaluation virtual environment and install `requirements-evaluation.lock.txt` first. Its name is arbitrary; use that environment's Python executable. The adapter imports and dependency consistency were checked, but importability is not a measured Ragas run.

The first command uses only original repository fixtures in a separate validation course. It exercises raw textbooks, figure-only slides, narrated video, source-cited tutoring, semantic embeddings and independently checked generated questions. It produces a success/partial report only after actual requests; failed processing remains visible.

The second command measures faithfulness, response relevancy, context precision and context recall on the versioned 60-case reference set: 20 text, 15 figure, 15 video and 10 off-material. Inspect extraction fidelity and timestamp alignment as well as evaluator scores. The references were authored from the source fixtures, not independently human-reviewed or validated by real student outcomes.

Full-fidelity PPTX rendering needs LibreOffice. The CI render job checks this path; the Windows development host does not have LibreOffice installed. The container includes it. Approximate previews stay explicitly labeled when it is absent.

## Measured evidence already available

The 30-case text audit in `evaluation/programmatic.baseline.json` reports source hit@4 95%, off-material refusal 100%, false refusal on answerable questions 5%, locator validity 100%, and exact-quote integrity 100%. These are programmatic checks on a small authored corpus; they are **not** semantic faithfulness or answer-relevancy results.

`evaluation/simulation.baseline.json` reports three synthetic learner profiles and three policies across 30 seeds. It does not establish that adaptive practice beats fixed order. Real student efficacy, semantic item repetition and calibrated mastery remain unproven.

## Required external deliverables

1. Record a 3–10 minute working-system walkthrough; upload it to YouTube public/unlisted with English audio or subtitles. The 45-second source lecture fixture is not this video.
2. Complete the Devpost description using actual implemented behavior and measured results.
3. Add all team members with their real full names and Devpost accounts; team size 1–4.
4. Verify the organizer's deadline and prior-work eligibility. Disclose the real implementation timeline and any reused components.

No Devpost page or YouTube video has been published by this repository work.

## Source package

After committing a clean tree:

```powershell
.\.venv\Scripts\python.exe -m learnproof.release
```

This produces a committed-source ZIP and an evidence report under ignored `output/submission/`. It verifies commit author/committer emails are `rayanakarthikeyan@gmail.com`, except the explicitly approved existing collaborator commit `0596173` by `sravyakalluri26@gmail.com` and excludes credentials, local histories and virtual environments. It does not silently turn pending checks into passes.
