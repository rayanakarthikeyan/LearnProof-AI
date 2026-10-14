# LearnProof AI — Devpost draft

Use this draft only after inserting the real demo link, team information and final measurements. Do not describe pending integrations as validated.

## Inspiration

A wrong answer rarely explains why a student is stuck. Course evidence is scattered across textbooks, slides and lectures, while a generic tutor can give a fluent explanation with no inspectable source. We wanted the next learning step to follow both the material and the learner's responses.

## What it does

LearnProof preserves original source locations, supports source-bound tutoring and gives MCQ, short-answer and numerical practice. When a response is incorrect, a persistent repair session asks a prerequisite probe and returns to a different problem on the original concept. A correct transfer response is observable evidence from one check, not a claim of lasting mastery.

The course library accepts raw PDF, PPTX and lecture video. Local mode provides actual document extraction and exact cited excerpts. Gemini mode adds diagram/video interpretation, semantic retrieval, generated explanations and separately checked assessment items. Insert the final live validation status here before publication.

## How we built it

React/TypeScript/Vite provides the interface; FastAPI and SQLite hold sources, concept suggestions, attempts, repair sessions and exams. Original page/slide images and retained video files make citations inspectable. Optional Gemini embeddings combine with BM25-style lexical retrieval through rank fusion. Generated claims are checked individually against only their own cited evidence, and model prose without citations is not presented as checked explanation.

Topic mastery uses Bayesian knowledge tracing with illustrative parameters. Ambiguous short answers remain unscored. Course-specific graph suggestions are validated for grounded unit references and cycles, while inferred prerequisites remain visibly tentative.

## What we measured

On the 30-case authored text reference set, the programmatic audit measured source-hit@4 95%, off-material refusal 100%, answerable false refusal 5%, locator validity 100%, and exact-quote integrity 100%. These checks do not measure semantic faithfulness or answer relevancy.

Add the **actual** 60-case Ragas metrics and per-modality failures after running the framework. The seeded simulation compares fixed-order, mastery-only and prerequisite policies across three profiles and 30 seeds; it is not real student efficacy evidence and does not show a consistent adaptive advantage.

## Challenges and limitations

Separating valid citations from genuinely supporting citations required claim-level verification. Keeping diagnostic sessions persistent and preventing repeated questions across mock exams required explicit server state. Full slide fidelity depends on LibreOffice. This is a loopback-first hackathon prototype, not a production authenticated multi-user service. Model interpretation and grading need evaluation; a configured key alone does not prove correctness.

## Prior work and implementation timeline

The author previously built Academia-Lab and DS-Portal. This repository implements its own learner/ingestion/assessment code; it does not copy those codebases. The proposal/starter and initial web prototype were committed on 11 October 2026; submission-focused improvements followed on 14 October 2026. Confirm organizer eligibility and state the work completed during the eligible event period truthfully.

Frontend component modularization and dark mode were contributed by GitHub user `sravyakalluri26`; the original commit and authorship are preserved. Add their real full name to the team information if they are participating in the submission.

## Links and team

- Public source: https://github.com/rayanakarthikeyan/LearnProof-AI
- Working-system YouTube demo: **add the actual public/unlisted link**
- Team members: **add real full names and Devpost accounts**
- Final benchmark: **link the measured report, with model/version and test-set manifest**
