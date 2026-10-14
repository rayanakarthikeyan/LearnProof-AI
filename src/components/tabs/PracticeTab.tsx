import { type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Loader2,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Citation, Feedback, Progress, Question } from "../../types";
import { CitationList, EmptyState, PageHeading } from "../Common";

interface PracticeTabProps {
  diagnosticStep: number | null;
  diagnosticCount: number;
  repairStage: string | null;
  topic: string;
  setTopic: (t: string) => void;
  kind: string;
  setKind: (k: string) => void;
  adaptive: boolean;
  setAdaptive: (a: boolean) => void;
  question: Question | null;
  selectionReason: string;
  response: string;
  setResponse: (r: string) => void;
  feedback: Feedback | null;
  repairTarget: string | null;
  practiceBusy: boolean;
  progress: Progress;
  onGetQuestion: (
    target?: string,
    format?: string,
    adapt?: boolean,
    reasonPrefix?: string,
  ) => void;
  onStartDiagnostic: () => void;
  onSubmitAnswer: (e: FormEvent) => void;
  onNextPractice: () => void;
  onOpenCitation: (c: Citation) => void;
}

export function PracticeTab({
  diagnosticStep,
  diagnosticCount,
  repairStage,
  topic,
  setTopic,
  kind,
  setKind,
  adaptive,
  setAdaptive,
  question,
  selectionReason,
  response,
  setResponse,
  feedback,
  repairTarget,
  practiceBusy,
  progress,
  onGetQuestion,
  onStartDiagnostic,
  onSubmitAnswer,
  onNextPractice,
  onOpenCitation,
}: PracticeTabProps) {
  return (
    <>
      <PageHeading
        eyebrow="FIND THE GAP · TRY AGAIN"
        title={
          diagnosticStep != null
            ? "A starting point for your path."
            : "Practice with a purpose."
        }
        subtitle={
          diagnosticStep != null
            ? `Diagnostic check ${diagnosticStep + 1} of ${diagnosticCount}. We use scored responses to make provisional topic estimates.`
            : "An unseen question, cited feedback, and a next step that follows your understanding."
        }
      />

      <div className="practice-layout">
        <aside className="panel practice-controls">
          <span className="eyebrow">YOUR PRACTICE SCOPE</span>
          <label>
            Topic
            <select
              aria-label="Practice topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {progress.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Question format
            <select
              aria-label="Question format"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="mcq">Multiple choice</option>
              <option value="short">Short answer</option>
              <option value="numerical">Numerical problem</option>
            </select>
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={adaptive}
              onChange={(e) => setAdaptive(e.target.checked)}
            />
            <span>
              Review weak prerequisites first
              <small>We’ll explain any change of topic.</small>
            </span>
          </label>
          <button
            className="button primary full-width"
            onClick={() => onGetQuestion()}
            disabled={practiceBusy || !topic}
          >
            {practiceBusy ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            Find my next question
          </button>
          <div className="controls-note">
            <ShieldCheck size={17} />
            <p>
              Each item is authored and reviewed, or generated with an
              independent check. Previously submitted items are excluded.
            </p>
          </div>
        </aside>

        <section className="panel question-panel">
          {question ? (
            <>
              <div className="question-top">
                <span className="badge-soft">
                  {question.kind === "mcq"
                    ? "MULTIPLE CHOICE"
                    : question.kind === "short"
                      ? "SHORT ANSWER"
                      : "NUMERICAL"}
                </span>
                <span className="difficulty">
                  Level {question.difficulty} / 3
                </span>
              </div>
              <div className="selection-note">
                <Network size={15} />
                {selectionReason}
              </div>
              <h2>{question.prompt}</h2>
              <form onSubmit={onSubmitAnswer}>
                {question.kind === "mcq" ? (
                  <div className="answer-options">
                    {question.options.map((option, i) => (
                      <label
                        className={`answer-option ${response === option ? "selected" : ""}`}
                        key={option}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={response === option}
                          onChange={() => setResponse(option)}
                          disabled={!!feedback || practiceBusy}
                        />
                        <span className="option-letter">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{option}</span>
                        {response === option && <Check size={16} />}
                      </label>
                    ))}
                  </div>
                ) : (
                  <label className="written-answer">
                    Your answer
                    {question.kind === "short" ? (
                      <textarea
                        aria-label="Your answer"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        disabled={!!feedback || practiceBusy}
                        placeholder="Explain it in your own words…"
                        maxLength={2000}
                      />
                    ) : (
                      <input
                        aria-label="Your numerical answer"
                        inputMode="decimal"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        disabled={!!feedback || practiceBusy}
                        placeholder="Enter a number"
                      />
                    )}
                  </label>
                )}
                {!feedback && (
                  <button
                    className="button primary"
                    disabled={!response.trim() || practiceBusy}
                  >
                    {practiceBusy ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    Check my answer
                  </button>
                )}
              </form>

              {feedback && (
                <div
                  className={`feedback-card ${
                    feedback.correct === false
                      ? "repair"
                      : feedback.correct == null
                        ? "unscored"
                        : "correct"
                  }`}
                  role="status"
                >
                  <div className="feedback-title">
                    {feedback.correct ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <CircleHelp size={20} />
                    )}
                    <h3>
                      {feedback.correct
                        ? "A little more understanding."
                        : feedback.correct === false
                          ? "A useful place to look closer."
                          : "This response needs a closer review."}
                    </h3>
                  </div>
                  <p>{feedback.feedback}</p>
                  <div className="expected-answer">
                    Reference answer: <strong>{feedback.answer}</strong>
                  </div>
                  {feedback.hypothesis && (
                    <p className="hypothesis">{feedback.hypothesis}</p>
                  )}
                  <CitationList
                    items={feedback.citations}
                    onOpen={onOpenCitation}
                  />
                  <div className="estimate-update">
                    {feedback.correct == null
                      ? "Mastery estimate unchanged"
                      : `Provisional estimate: ${Math.round((feedback.prior ?? feedback.estimate) * 100)}% → ${Math.round(
                          feedback.estimate * 100,
                        )}%`}
                  </div>
                  <button
                    className="button primary"
                    onClick={onNextPractice}
                    disabled={practiceBusy}
                  >
                    {diagnosticStep === diagnosticCount - 1
                      ? "View my starting point"
                      : feedback.correct === false
                        ? "Try a diagnostic follow-up"
                        : repairTarget
                          ? repairStage === "transfer"
                            ? "Finish this repair session"
                            : "Check transfer on the original topic"
                          : "Try a different problem"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              <div className="question-source">
                <ShieldCheck size={14} />
                {question.origin === "authored-demo"
                  ? "Authored sample item · reviewed against the sample notes"
                  : "Generated item · independent source check"}
                {!feedback && (
                  <CitationList
                    items={question.citations}
                    onOpen={onOpenCitation}
                  />
                )}
              </div>
            </>
          ) : (
            <EmptyState
              title={
                selectionReason || "One focused question. A clearer next step."
              }
              text="Choose your topic and format, then find an unseen question. Or start with a three-question diagnostic."
              action={
                <button
                  className="button secondary"
                  onClick={onStartDiagnostic}
                >
                  Start diagnostic <ArrowRight size={16} />
                </button>
              }
            />
          )}
        </section>
      </div>
    </>
  );
}
