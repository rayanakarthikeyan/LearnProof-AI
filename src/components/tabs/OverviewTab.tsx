import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Network,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import type { Progress, Source, Tab } from '../../types';
import { SectionHeader, SourceCard, Stat, sourceIcon } from '../Common';

interface OverviewTabProps {
  progress: Progress;
  sources: Source[];
  indexed: Source[];
  average: number | null;
  weakest: { id: string; name: string } | undefined;
  uploading: boolean;
  onSetTab: (tab: Tab) => void;
  onStartDiagnostic: () => void;
  onSelectTopic: (topicId: string) => void;
  onOpenSource: (source: Source) => void;
  onTriggerUpload: () => void;
}

export function OverviewTab({
  progress,
  sources,
  indexed,
  average,
  weakest,
  uploading,
  onSetTab,
  onStartDiagnostic,
  onSelectTopic,
  onOpenSource,
  onTriggerUpload,
}: OverviewTabProps) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE CLEARER, EVERY DAY</div>
          <h1>
            Build understanding.<br className="mobile-break" /> Keep the proof.
          </h1>
          <p>Your material, your learning path. Let’s find the next step that matters.</p>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            onSetTab('library');
            onTriggerUpload();
          }}
        >
          <Plus size={17} /> Add material
        </button>
      </div>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-tag">
            <Sparkles size={14} /> YOUR NEXT LEARNING STEP
          </span>
          <h2>
            {progress.scored_attempts
              ? 'Turn a weak spot into\na moment of clarity.'
              : 'Knowing where you’re stuck\nis where progress begins.'}
          </h2>
          <p>
            {progress.scored_attempts
              ? `Revisit ${weakest?.name.toLowerCase() || 'a weak topic'}, see the original evidence, then try a different problem.`
              : 'A short check helps us understand what you know — and what to explore together.'}
          </p>
          <button
            className="button light"
            onClick={
              progress.scored_attempts
                ? () => {
                    onSetTab('practice');
                    onSelectTopic(weakest?.id || 'pointers');
                  }
                : onStartDiagnostic
            }
          >
            {progress.scored_attempts ? 'Continue my learning path' : 'Check my understanding'}
            <ArrowRight size={17} />
          </button>
          <span className="hero-foot">
            <Clock3 size={13} />
            {progress.scored_attempts
              ? 'One focused topic at a time'
              : '3 questions · A starting point, not a grade'}
          </span>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="diagram-label label-one">FIND THE GAP</div>
          <div className="diagram-label label-two">FOLLOW THE EVIDENCE</div>
          <div className="diagram-label label-three">TRY SOMETHING NEW</div>
          <div className="node n1">
            <Network size={27} />
          </div>
          <div className="node n2">
            <BookOpen size={22} />
          </div>
          <div className="node n3">
            <Check size={23} />
          </div>
          <div className="path-line line-one" />
          <div className="path-line line-two" />
          <div className="dot-grid" />
        </div>
      </section>

      <div className="stats-row">
        <Stat
          label="Course sources"
          value={String(indexed.length).padStart(2, '0')}
          detail="Ready to explore"
          icon={<BookOpen size={19} />}
        />
        <Stat
          label="Topics explored"
          value={`${progress.observed_topics} / ${progress.topics.length}`}
          detail="With scored evidence"
          icon={<Network size={19} />}
        />
        <Stat
          label="Practice responses"
          value={String(progress.total_attempts).padStart(2, '0')}
          detail={`${progress.scored_attempts} scored responses`}
          icon={<CheckCircle2 size={19} />}
        />
        <Stat
          label="Mastery estimate"
          value={average == null ? '—' : `${average}%`}
          detail={average == null ? 'Start with a short check' : 'Provisional · observed topics'}
          icon={<TrendingUp size={19} />}
        />
      </div>

      <div className="overview-grid">
        <section className="panel path-panel">
          <SectionHeader
            eyebrow="ONE CONCEPT AT A TIME"
            title="Your learning path"
            action={
              <button className="text-button" onClick={() => onSetTab('progress')}>
                View understanding <ArrowUpRight size={14} />
              </button>
            }
          />
          <div className="path-grid">
            {progress.topics.slice(0, 4).map((t, i) => (
              <button
                className="topic-path"
                key={t.id}
                onClick={() => {
                  onSetTab('practice');
                  onSelectTopic(t.id);
                }}
              >
                <span className={`path-step ${t.observations ? 'observed' : ''}`}>
                  {t.observations ? <Check size={16} /> : `0${i + 1}`}
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <small>
                    {t.observations
                      ? `${Math.round(t.estimate * 100)}% estimate · ${t.observations} checks`
                      : 'Not checked yet'}
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          <div className="panel-footnote">
            <ShieldCheck size={15} />
            Progress follows your responses, not time spent on a page.
          </div>
        </section>

        <section className="panel evidence-panel">
          <span className="badge-soft">
            <ShieldCheck size={15} /> EVERY ANSWER HAS A PLACE
          </span>
          <h3>Don’t just take<br />our word for it.</h3>
          <p>Open the exact page, slide or video moment behind an explanation.</p>
          <div className="mini-source">
            <span className="file-icon pdf">
              <FileText size={20} />
            </span>
            <div>
              <strong>Your course, in context</strong>
              <small>Original source · inspectable evidence</small>
            </div>
          </div>
          <button className="text-button" onClick={() => onSetTab('tutor')}>
            Ask the evidence tutor <ArrowRight size={16} />
          </button>
        </section>
      </div>

      <section className="materials-section">
        <SectionHeader
          title="On your bookshelf"
          action={
            <button className="text-button" onClick={() => onSetTab('library')}>
              Open library <ArrowRight size={14} />
            </button>
          }
        />
        <div className="source-grid">
          {sources.slice(0, 3).map((s) => (
            <SourceCard key={s.id} source={s} onOpen={() => onOpenSource(s)} />
          ))}
          <button
            className="source-add"
            onClick={onTriggerUpload}
            disabled={uploading}
          >
            <UploadCloud size={23} />
            <strong>Make it your course</strong>
            <small>Add notes, slides or a lecture</small>
          </button>
        </div>
      </section>
    </>
  );
}
