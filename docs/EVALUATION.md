# Evaluation protocol

**No RAG benchmark or student-effectiveness results have been measured in this repository.** Starter unit tests check deterministic behavior; they are not Ragas results or evidence of learning gains.

## Frozen evidence set

Build 60 annotated questions on the chosen course packet: 20 text-led, 15 diagram-dependent, 15 video-dependent and 10 off-material. Annotate expected answer, acceptable source units/locations, modality, concept and refusal label. Include easy/hard cases, noisy scans and ambiguous questions. Keep development examples separate from these evaluation questions. Review references manually; generated reference answers are not automatically gold.

For answerable questions, record retrieved units, generated response, cited units, latency and model/prompt version. Run [Ragas](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) faithfulness, response relevancy, context precision and context recall with a compatible pinned evaluator. Preserve raw outputs and specify the evaluator provider/model. A framework score is not a substitute for manually checking citation support.

Measure off-material cases separately: refusal precision and recall, false refusals on answerable questions, unsupported answer rate. Do not give refusal responses a misleading content-recall score.

## Required comparisons

| Comparison | Question it resolves |
| --- | --- |
| Text-only extraction vs text plus visuals | Does figure interpretation improve diagram-question performance? |
| Fixed question order vs mastery-based selection | Does adapting improve performance under the same practice budget? |
| Mastery-only selection vs prerequisite repair | Does diagnosis help beyond simply selecting low scores? |

Hold corpus, student seeds, question budget and model configuration constant. Report failures and per-modality results rather than only the average. Prefer repeated runs/seeds with variability or intervals. With a small test set, describe uncertainty rather than implying statistical certainty.

## Assessment audit

Generate a bank covering MCQ, short-answer and numerical problems. Have a reviewer independently judge source support, solvability, key/rubric correctness, topic/difficulty tags and ambiguous options. Report accepted fraction and reasons for rejection. Evaluate numerical answers with known results and units/tolerances. Repeat rate must include semantically equivalent items, not only identical IDs.

## Simulated learner runs

Use at least three explicit profiles: pointer beginner, learner who rewires links but confuses traversal cost, and advanced learner. Run each across five sessions and multiple random seeds with equal practice budgets. The simulator has a hidden per-concept state distinct from the tutor's estimate. Response probability depends on hidden mastery, difficulty and declared guess/slip parameters. Interventions alter hidden state under an explicit, published assumption; do not hardcode that LearnProof always improves it.

Report:

- Tutor's estimated mastery change, separate from simulator hidden-state change.
- Held-out transfer accuracy on unseen items, including delayed checks if modeled.
- Question repetition rate = repeated/near-duplicate delivered items divided by delivered items.
- Time/questions to reach a declared simulated performance threshold.
- Results for fixed order, mastery-only and prerequisite-repair policies.

Simulations test behavior under their assumptions, not real educational efficacy. One demo student's correct response is not evidence of lasting learning.

## Proposed engineering targets

Targets below are aspirations, not existing results or official event thresholds: at least 95% valid source locators on the annotated set; no knowingly accepted incorrect answer keys; zero duplicate IDs within a learner's available verified bank; high refusal recall without excessive false refusals. Report actual measurements even when targets are missed. Do not prefill a dashboard with expected numbers.

## Results artifact layout to implement

Save corpus manifest/hashes, reference annotations, retrieval/generation JSONL, evaluator configuration, seeded learner traces, metric summaries, costs/latencies and failure examples under an evaluation directory. Include one documented command to regenerate the report. Exclude restricted copyrighted source files if redistribution is not permitted, while documenting how authorized evaluators can supply them.
