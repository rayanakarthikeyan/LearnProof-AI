import { useEffect, useState } from "react";
import { CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";
import type { ApiClient } from "./types";
type Report = {
  checks: { id: string; label: string; passed: boolean; detail: string }[];
  programmatic: null | {
    case_count: number;
    metrics: Record<string, number | null>;
    limits: string;
  };
  external_deliverables: string[];
  note: string;
};
export default function Readiness({
  api,
  course,
}: {
  api: ApiClient;
  course: string;
}) {
  const [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    api<Report>(`/courses/${course}/readiness`)
      .then((r) => current && setReport(r))
      .catch((e) => current && setError(e.message));
    return () => {
      current = false;
    };
  }, [api, course]);
  return (
    <>
      {error && <div className="error-banner">{error}</div>}
      {report && (
        <>
          <section className="panel readiness-panel">
            <div className="section-header">
              <h2>Submission evidence checklist</h2>
              <ShieldCheck size={20} />
            </div>
            <div className="readiness-grid">
              {report.checks.map((c) => (
                <div key={c.id} className={c.passed ? "ready" : "pending"}>
                  {c.passed ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <CircleHelp size={18} />
                  )}
                  <div>
                    <strong>{c.label}</strong>
                    <small>{c.detail}</small>
                  </div>
                  <span>{c.passed ? "EVIDENCE PRESENT" : "PENDING"}</span>
                </div>
              ))}
            </div>
          </section>
          {report.programmatic && (
            <section className="panel audit-panel">
              <div className="section-header">
                <h2>Measured programmatic audit</h2>
                <span className="tiny-label">
                  {report.programmatic.case_count} REFERENCE CASES
                </span>
              </div>
              <div className="audit-metrics">
                {Object.entries(report.programmatic.metrics).map(
                  ([name, value]) => (
                    <div key={name}>
                      <strong>
                        {value == null ? "—" : `${Math.round(value * 100)}%`}
                      </strong>
                      <small>{name.replaceAll("_", " ")}</small>
                    </div>
                  ),
                )}
              </div>
              <p className="muted">{report.programmatic.limits}</p>
            </section>
          )}
          <section className="panel external-deliverables">
            <h2>Before the final submission</h2>
            <ul>
              {report.external_deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p className="muted">{report.note}</p>
          </section>
        </>
      )}
    </>
  );
}
