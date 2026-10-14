import { BookOpen, Network } from "lucide-react";
import type { Citation, Topic } from "./types";
export function ConceptMap({
  topics,
  onPractice,
}: {
  topics: Topic[];
  onPractice: (id: string) => void;
}) {
  return (
    <section className="panel concept-map">
      <div className="section-header">
        <h2>How your concepts connect</h2>
        <span className="tiny-label">PREREQUISITES</span>
      </div>
      <div className="concept-map-grid">
        {topics.map((t) => (
          <button key={t.id} onClick={() => onPractice(t.id)}>
            <Network size={19} />
            <strong>{t.name}</strong>
            <span>
              {t.prerequisites.length ? (
                <>
                  Builds on{" "}
                  {t.prerequisites
                    .map((id) => topics.find((p) => p.id === id)?.name || id)
                    .join(", ")}
                </>
              ) : (
                "A starting concept"
              )}
            </span>
            <small>
              {t.observations
                ? `${Math.round(t.estimate * 100)}% provisional estimate`
                : "No scored evidence yet"}
            </small>
            <small>
              {(t as Topic & { origin?: string }).origin?.includes("suggested")
                ? "Suggested graph · inspect before relying on it"
                : "Authored course graph"}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}
export function RevisionCards({
  items,
  onCitation,
}: {
  items: {
    topic: Topic;
    excerpt: string;
    citation: Citation;
    prompt: string;
  }[];
  onCitation: (c: Citation) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="panel revision-panel">
      <div className="section-header">
        <h2>Focused revision, from your sources</h2>
      </div>
      <div className="revision-grid">
        {items.map((item) => (
          <article key={item.topic.id}>
            <h3>{item.topic.name}</h3>
            <p>{item.excerpt}</p>
            <small>{item.prompt}</small>
            <button
              className="text-button"
              onClick={() => onCitation(item.citation)}
            >
              <BookOpen size={14} />
              Open {item.citation.location}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
