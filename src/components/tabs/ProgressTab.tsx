import {
  ArrowRight,
  Check,
  CircleHelp,
  Network,
  ShieldCheck,
} from "lucide-react";
import type { Progress, Tab } from "../../types";
import { EmptyState, PageHeading, SectionHeader } from "../Common";

interface ProgressTabProps {
  progress: Progress;
  weakest: { id: string; name: string; description: string } | undefined;
  onSetTab: (t: Tab) => void;
  onSelectTopic: (topicId: string) => void;
  onStartDiagnostic: () => void;
}

export function ProgressTab({
  progress,
  weakest,
  onSetTab,
  onSelectTopic,
  onStartDiagnostic,
}: ProgressTabProps) {
  return (
    <>
      <PageHeading
        eyebrow="UNDERSTANDING TAKES EVIDENCE"
        title="Your understanding, so far."
        subtitle="A living estimate of what you know. Every update follows a scored response."
      />

      <div className="info-note">
        <ShieldCheck size={17} />
        <span>{progress.estimate_note}</span>
      </div>

      <div className="progress-layout">
        <section className="panel">
          <SectionHeader
            title="Concept by concept"
            action={
              <span className="tiny-label">
                {progress.scored_attempts} SCORED CHECKS
              </span>
            }
          />
          <div className="mastery-list">
            {progress.topics.map((t) => (
              <div className="mastery-row" key={t.id}>
                <div className="mastery-heading">
                  <strong>{t.name}</strong>
                  <span>
                    {t.observations
                      ? `${Math.round(t.estimate * 100)}%`
                      : "Not assessed"}
                  </span>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${t.observations ? t.estimate * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="mastery-meta">
                  <span>
                    {t.observations} scored observations
                    {t.prerequisites.length
                      ? ` · Needs ${t.prerequisites
                          .map(
                            (p) =>
                              progress.topics.find((x) => x.id === p)?.name,
                          )
                          .join(", ")}`
                      : ""}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => {
                      onSetTab("practice");
                      onSelectTopic(t.id);
                    }}
                  >
                    Practice <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader title="What to explore next" />
          <span className="next-icon">
            <Network size={26} />
          </span>
          <h3>{weakest?.name || "Start with a diagnostic"}</h3>
          <p>{weakest?.description}</p>
          <p className="muted">
            {progress.scored_attempts
              ? "This topic has one of your lowest provisional estimates. A focused check can help identify the next step."
              : "There is no scored history yet. A diagnostic gives us a starting point."}
          </p>
          <button
            className="button primary"
            onClick={
              progress.scored_attempts
                ? () => {
                    onSetTab("practice");
                    onSelectTopic(weakest?.id || "pointers");
                  }
                : onStartDiagnostic
            }
          >
            Take the next step <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <section className="panel activity-panel">
        <SectionHeader title="Your evidence trail" />
        {progress.attempts.length ? (
          <div className="activity-list">
            {progress.attempts.map((a) => (
              <div className="activity-row" key={a.id}>
                <span
                  className={`activity-icon ${a.correct === 1 ? "positive" : ""}`}
                >
                  {a.correct === 1 ? (
                    <Check size={17} />
                  ) : (
                    <CircleHelp size={17} />
                  )}
                </span>
                <div>
                  <strong>{a.prompt}</strong>
                  <p>
                    {a.correct == null
                      ? "Unscored · review needed"
                      : a.correct
                        ? "Correct response"
                        : "Incorrect response"}{" "}
                    ·{" "}
                    {a.kind === "mcq"
                      ? "Multiple choice"
                      : a.kind === "short"
                        ? "Short answer"
                        : "Numerical"}
                  </p>
                </div>
                <span className="activity-date">
                  {a.created_at.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your first check is the first piece of evidence."
            text="Practice responses will appear here with their outcomes."
          />
        )}
      </section>
    </>
  );
}
