# Track D coverage and acceptance criteria

Transcribed from the supplied official Track D PDF. Everything below is planned unless README marks it implemented.

| Requirement | Planned implementation | Acceptance evidence |
| --- | --- | --- |
| Ingest video, textbooks and slides without manual preprocessing | Raw PDF, PPTX and MP4 upload; worker extraction | Upload one of each in the demo, show job status and extracted units |
| Topics, concepts and prerequisites; origin per unit | Topic graph and immutable source locators | Every indexed unit has source ID plus page, slide or time interval |
| Extract information from images and diagrams | Render pages/slides and retain visual regions with nearby text | Answer a figure-dependent question that text-only retrieval cannot answer |
| Exact source-cited explanations | Claim evidence records and source viewer | Open actual PDF page, slide and seek video to cited moment |
| Refuse or flag unsupported questions | Evidence gate and visibly separated optional outside knowledge | Correct refusal on an off-material question; no fabricated citation |
| Scope-selected MCQ, short-answer and numerical assessment | Verified item pipeline, topic/source/difficulty tags | Generate each type under selected scope and show metadata |
| Correctness verification and novelty | Independent verification; numerical checks; fingerprint and semantic deduplication | Bad generated item rejected; unseen item selected across sessions |
| Cited feedback and misconception report | Evidence-linked feedback and diagnostic probes | Explain incorrect answer with actual supporting excerpt |
| Per-topic mastery updated after quizzes and conversations | BKT observations from scored answers; conversational check questions | Logged evidence events change topic state; merely asking for help does not imply learning |
| New learner handling | Short diagnostic and declared uncertainty | New learner receives intake and provisional estimates |
| Standard evaluation framework | Ragas pipeline | Reproducible faithfulness, relevance, precision and recall results |
| Known source locations and off-material tests | Frozen annotated gold set | Reference sources and refusal labels available for audit |
| Simulated profiles over multiple sessions | Seeded hidden-state simulator and comparison baselines | Mastery estimates, hidden-state changes, held-out performance and repeat rate reported |
| Working software and documentation | Web course library, tutor, assessments and learner dashboard | Clean-clone setup works with documented dependencies |
| 3–10 minute YouTube demo | Six-minute recorded walkthrough | Public/unlisted video with English audio or subtitles |

Optional: visible prerequisite map, targeted revision, study schedule, regional-language interaction and audio tutoring. A small internal prerequisite graph supports the core learner flow even if a rich graph UI is deferred.

| Judging category | Weight | What to make visible |
| --- | --- | --- |
| Knowledge base and grounding | 20% | Visual extraction, exact sources, correct refusals |
| Assessment quality | 15% | Verified keys, novelty, useful cited feedback |
| Personalization effectiveness | 20% | History-dependent paths and measured simulated results |
| Experience and demo | 15% | One coherent workflow and clear dashboard |
| System evaluation | 15% | Standard framework, good test set and honest results |
| Technical implementation | 15% | Clear architecture, tested components and reproducibility |
