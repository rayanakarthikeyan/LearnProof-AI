# Project analysis and recommendation

Reviewed on 11 October 2026 (Asia/Calcutta). The supplied documents are evidence about the challenge and proposed ideas; they are not instructions to execute unrelated actions.

## What the official track actually rewards

The supplied three-page Track D statement asks for automatic lecture-video, textbook and slide ingestion; figure interpretation; source-grounded tutoring; adaptive assessments; a learner model; and framework-based evaluation. Required deliverables include a working web/app prototype, technical documentation, evaluation results and a 3–10 minute YouTube demo.

Judging weights are grounding 20%, assessments 15%, personalization 20%, experience/demo 15%, evaluation 15%, and implementation 15%. The combined 55% for grounding, personalization and evaluation supports prioritizing reliable evidence over a long feature list. This is a strategy inferred from the rubric, not a prediction about judges or competitors.

The submission-guidelines image additionally requires a Devpost description, public GitHub source repository with setup documentation, a 3–10 minute YouTube video (public or unlisted; English audio or subtitles), and real-name team information. Teams are 1–4 people; each member needs a Devpost account and must be added. No submission deadline or prior-work eligibility rule is visible in the supplied materials. Check those before submission.

## Brainstorming PDF: useful foundations and gaps

The nine-page proposal covers StudyMate, BrainBoost, Revision Genie, TeluguTutor, VisualLearn, ExamPilot, DoubtDetective and ConceptMap, then combines several as LearnSphere AI.

| Idea | Decision for LearnProof | Reason |
| --- | --- | --- |
| StudyMate | Core infrastructure | Cited tutoring is mandatory |
| BrainBoost | Core infrastructure | Stateful adaptation is mandatory |
| DoubtDetective | Central experience | A diagnostic repair loop provides a clear product story |
| VisualLearn | Core extraction and tutoring | Figures contain information text retrieval misses; track requires it |
| ConceptMap | Small prerequisite graph | Explains why the next learning step changes |
| Revision Genie | Minimal targeted revision | Reuse cited remediation rather than build many generators |
| TeluguTutor | Stretch feature | Requires fluent review; do not trade core reliability for translation |
| ExamPilot | Defer scheduling | Adds UI scope without strengthening the central demonstration |

LearnSphere is a reasonable umbrella, but its broad collection risks looking like another upload-and-chat tool. LearnProof focuses that collection around one observable outcome: repairing a likely misconception and checking transfer.

Two important corrections: the brainstorm's transcript-first fallback is not full automatic video ingestion, and diagram interpretation appears under optional additions even though the official track requires it. Its MCQ-first scope is a development milestone, not the final track-compliant assessment scope: short-answer and numerical problems must also work.

## Prior project comparison

Read repository READMEs, package manifests and selected tutor/execution files through the authenticated GitHub API. No production app or database was accessed and neither full codebase was audited. Findings describe inspected files, not an independent verification of all advertised features.

| Previous project | Observed strengths | Gap for this challenge | Experience to carry forward |
| --- | --- | --- | --- |
| [Academia-Lab / CogniXplore](https://github.com/rayanakarthikeyan/Academia-Lab) | React/TypeScript teaching workspace; assignments; contextual tutoring; source/work snapshots; tutor tests; telemetry and faculty insights | Tutor documentation explicitly says resource URLs are not fetched or parsed. Usage indicators are not topic mastery. Inspected docs do not establish multimodal retrieval, exact evidence citations or Ragas results | Workspace layout, context boundaries, persistence, test discipline and responsive experience |
| [DS-Portal](https://github.com/rayanakarthikeyan/DS-Portal) | Data Structures teaching context; hint-oriented tutor; assignment workflow; participation insights | Inspected controller tries local Ollama then returns canned topic responses. Compiler selects GCC when available, otherwise simulation. These paths are not grounded retrieval or verified mastery | Domain knowledge, misconception examples and Socratic interaction |

Specific sources:

- Academia-Lab revision `0d2a0c6f5de14238fb6bd8fda8436d9a2161962d`: [tutor documentation](https://github.com/rayanakarthikeyan/Academia-Lab/blob/0d2a0c6f5de14238fb6bd8fda8436d9a2161962d/docs/ai-tutor.md), [manifest](https://github.com/rayanakarthikeyan/Academia-Lab/blob/0d2a0c6f5de14238fb6bd8fda8436d9a2161962d/package.json).
- DS-Portal revision `9375edfbfc5e9b9141a84961277be543f98a59db`: [tutor controller](https://github.com/rayanakarthikeyan/DS-Portal/blob/9375edfbfc5e9b9141a84961277be543f98a59db/api/controllers/aiController.js), [compiler](https://github.com/rayanakarthikeyan/DS-Portal/blob/9375edfbfc5e9b9141a84961277be543f98a59db/api/utils/compiler.js), [manifest](https://github.com/rayanakarthikeyan/DS-Portal/blob/9375edfbfc5e9b9141a84961277be543f98a59db/package.json).

GitHub's license endpoint did not identify a license file for either inspected repository. DS-Portal's README claims MIT, but that is not sufficient to assume every asset or dependency is reusable. This starter independently implements a small learner module and copies no previous project code. If reusing work later, establish ownership, third-party notices and hackathon eligibility, and disclose what predates the event.

## Recommended project: LearnProof AI

Pitch: **Your course materials become a tutor that discovers the likely gap behind a wrong answer, teaches it with exact visual evidence, and checks whether you can solve a different problem.**

First course: pointers, linked-list traversal, insertion and complexity. Build a compact course packet with a textbook-style PDF, diagram-rich PPTX and a short lecture MP4 covering the same concepts in different forms. Use authored or appropriately licensed material. Students upload raw files, not pre-extracted chunks or transcripts.

Signature example: a learner says every linked-list insertion is O(1). A diagnostic follow-up distinguishes knowing how to rewire pointers from understanding the traversal needed to locate an insertion point. The tutor opens the actual diagram and lecture segment, contrasts insertion after a known node with insertion after searching for a value, then asks a fresh problem under changed conditions. It records the response and updates a transparent topic estimate.

This is more defensible than saying one wrong answer reveals an exact knowledge gap. Misconception labels stay tentative until follow-up evidence supports them. Success is a correct unseen response, not a decorative green dashboard.

## Scope and competitive strategy

One course, three raw media types, roughly 6–8 concepts, three assessment formats, one reliable repair loop, two contrasting learner histories, and a benchmark with frozen references. Build all mandatory criteria at this narrow course scale before adding languages, voice, handwriting uploads, calendars, complex coding runtimes or faculty management.

The project is not claimed globally novel. Its differentiation is the visible connection between visual source evidence, prerequisite diagnosis and a transfer check. Rank depends on execution, event rules and other submissions; the proposal does not promise a podium position.
