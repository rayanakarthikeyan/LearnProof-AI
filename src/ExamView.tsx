import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import type { ApiClient, Citation, Exam, Topic } from "./types";

export default function ExamView({
  api,
  course,
  topics,
  onCitation,
  onProgress,
}: {
  api: ApiClient;
  course: string;
  topics: Topic[];
  onCitation: (c: Citation) => void;
  onProgress: () => Promise<void>;
}) {
  const [scope, setScope] = useState<string[]>([]),
    [count, setCount] = useState(6);
  const [exam, setExam] = useState<Exam | null>(null),
    [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [history, setHistory] = useState<{ id: string; created_at: string }[]>(
    [],
  );
  useEffect(() => {
    setExam(null);
    setScope(topics.slice(0, 3).map((t) => t.id));
    api<{ id: string; created_at: string }[]>(`/courses/${course}/exams`)
      .then(setHistory)
      .catch((e) => setError(e.message));
  }, [api, course]);
  useEffect(() => {
    if (!scope.length && topics.length)
      setScope(topics.slice(0, 3).map((t) => t.id));
  }, [topics]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      setExam(
        await api<Exam>(`/courses/${course}/exams`, {
          method: "POST",
          body: JSON.stringify({
            concepts: scope,
            kinds: ["mcq", "short", "numerical"],
            count,
          }),
        }),
      );
      setAnswer("");
      setHistory(await api(`/courses/${course}/exams`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function resume(id: string) {
    setBusy(true);
    try {
      setExam(await api<Exam>(`/exams/${id}`));
      setAnswer("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const question = exam?.questions.find(
    (q) => !exam.submitted_ids.includes(q.id),
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!question || !exam) return;
    setBusy(true);
    setError("");
    try {
      await api(`/questions/${question.id}/answer`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });
      setExam(await api<Exam>(`/exams/${exam.id}`));
      setAnswer("");
      await onProgress();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A COMPLETE CHECK OF YOUR SCOPE</span>
          <h1>Your mock exam.</h1>
          <p>
            A balanced set of unseen, verified items. Your results come with
            course evidence.
          </p>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="practice-layout">
        <aside className="panel exam-scope">
          <span className="eyebrow">TOPICS TO INCLUDE</span>
          {topics.map((t) => (
            <label key={t.id} className="toggle-label">
              <input
                type="checkbox"
                checked={scope.includes(t.id)}
                onChange={(e) =>
                  setScope(
                    e.target.checked
                      ? [...scope, t.id]
                      : scope.filter((id) => id !== t.id),
                  )
                }
              />
              {t.name}
            </label>
          ))}
          <label className="exam-count">
            Questions
            <select
              aria-label="Exam question count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[3, 6, 9, 12].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <p className="muted">
            Multiple choice, short answer and numerical, where verified items
            exist. Insufficient banks are flagged explicitly.
          </p>
          <button
            className="button primary full-width"
            onClick={create}
            disabled={busy || !scope.length}
          >
            {busy && <Loader2 className="spin" size={16} />}Create mock exam
          </button>
          {history.length > 0 && (
            <div className="exam-history">
              <h3>Saved exams</h3>
              {history.map((h) => (
                <button
                  className="text-button"
                  key={h.id}
                  onClick={() => void resume(h.id)}
                >
                  Resume {h.created_at.slice(0, 16)}
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          )}
        </aside>
        <section className="panel question-panel">
          {!exam ? (
            <div className="empty-state">
              <BookOpen size={32} />
              <h3>Choose a scope. Check the whole picture.</h3>
              <p>
                Exams and submitted responses persist across reloads. Previously
                reserved or answered exam items are excluded from new exams.
              </p>
            </div>
          ) : exam.completed ? (
            <>
              <span className="badge-soft">
                <CheckCircle2 size={15} />
                EXAM COMPLETE
              </span>
              <h2>
                {exam.correct} correct / {exam.scored} scored
              </h2>
              <p>
                {exam.unscored} responses need semantic review. They did not
                change mastery.
              </p>
              <h3 className="exam-report-heading">Topics to revisit</h3>
              <p>
                {exam.weak_topics.length
                  ? exam.weak_topics
                      .map((id) => topics.find((t) => t.id === id)?.name || id)
                      .join(", ")
                  : "No incorrect scored responses in this exam. Check transfer with new problems before assuming mastery."}
              </p>
              <div className="exam-feedback">
                {exam.feedback.map((item) => (
                  <article key={item.question_id}>
                    <strong>
                      {
                        exam.questions.find((q) => q.id === item.question_id)
                          ?.prompt
                      }
                    </strong>
                    <p>{item.feedback}</p>
                    <div className="citations">
                      {item.citations.map((c) => (
                        <button key={c.id} onClick={() => onCitation(c)}>
                          <BookOpen size={13} />
                          {c.location}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            question && (
              <>
                <div className="question-top">
                  <span className="badge-soft">
                    {question.kind.toUpperCase()}
                  </span>
                  <span className="difficulty">
                    {exam.submitted_ids.length + 1} / {exam.questions.length}
                  </span>
                </div>
                <h2>{question.prompt}</h2>
                <form onSubmit={submit}>
                  {question.kind === "mcq" ? (
                    <div className="answer-options">
                      {question.options.map((option, i) => (
                        <label
                          key={option}
                          className={`answer-option ${answer === option ? "selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="exam-answer"
                            value={option}
                            checked={answer === option}
                            onChange={() => setAnswer(option)}
                            disabled={busy}
                          />
                          <span className="option-letter">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {option}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <label className="written-answer">
                      Your answer
                      <input
                        aria-label="Exam answer"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        maxLength={2000}
                        disabled={busy}
                        inputMode={
                          question.kind === "numerical" ? "decimal" : "text"
                        }
                      />
                    </label>
                  )}
                  <button
                    className="button primary"
                    disabled={busy || !answer.trim()}
                  >
                    {busy ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    Submit and continue
                  </button>
                </form>
                <div className="question-source">
                  Verified item · answers and cited feedback appear in your
                  final report.
                </div>
              </>
            )
          )}
        </section>
      </div>
    </>
  );
}
