import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  FlaskConical,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { PageHeading, SectionHeader } from '../Common';

interface EvaluationTabProps {
  evaluation: Record<string, unknown> | null;
}

export function EvaluationTab({ evaluation }: EvaluationTabProps) {
  const metricNames = [
    'Faithfulness',
    'Response relevancy',
    'Context precision',
    'Context recall',
  ];

  return (
    <>
      <PageHeading
        eyebrow="MEASURE IT. DON’T ASSUME IT."
        title="Evidence about LearnProof."
        subtitle="Quality metrics belong here only after they have actually been measured."
      />

      <div className="evaluation-banner">
        <span className="next-icon">
          <FlaskConical size={29} />
        </span>
        <div>
          <h2>
            {evaluation?.status === 'not-run'
              ? 'The benchmark hasn’t run yet.'
              : 'Course evaluation report'}
          </h2>
          <p>{String(evaluation?.message || 'Loading the evaluation report…')}</p>
        </div>
        <span className="status-badge">
          {evaluation?.status === 'not-run' ? 'NOT MEASURED' : 'REPORT AVAILABLE'}
        </span>
      </div>

      <div className="metric-grid">
        {metricNames.map((name) => (
          <div className="panel metric-card" key={name}>
            <span className="tiny-label">{name}</span>
            <strong>
              {evaluation?.metrics && typeof evaluation.metrics === 'object'
                ? String(
                    (evaluation.metrics as Record<string, unknown>)[
                      name.toLowerCase().replaceAll(' ', '_')
                    ] ?? '—'
                  )
                : '—'}
            </strong>
            <small>
              {evaluation?.status === 'not-run'
                ? 'Requires a real Ragas run'
                : 'From the saved benchmark'}
            </small>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        <section className="panel">
          <SectionHeader title="What we plan to measure" />
          <ul className="evaluation-list">
            <li>
              <ShieldCheck size={17} /> Support for each claim and the accuracy of its citation
            </li>
            <li>
              <BookOpen size={17} /> Retrieval quality across text, figures and lectures
            </li>
            <li>
              <CircleHelp size={17} /> Correct refusals without excessive false refusals
            </li>
            <li>
              <Network size={17} /> Personalization against a fixed-order baseline
            </li>
            <li>
              <CheckCircle2 size={17} /> Verified questions and repetition across sessions
            </li>
          </ul>
        </section>

        <section className="panel">
          <SectionHeader title="Reproducible, by design" />
          <p>
            The repository contains an evaluation runner, a gold-set template and a seeded learner
            simulator. Framework scores and simulated outcomes are reported separately.
          </p>
          <div className="code-note">
            python -m learnproof.evaluate<br />
            python -m learnproof.simulate
          </div>
          <p className="muted">
            Targets are not results. Simulated behavior is not evidence of real student learning.
          </p>
        </section>
      </div>
    </>
  );
}
