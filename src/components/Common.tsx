import React from 'react';
import { ArrowUpRight, BookOpen, Layers3, Video, FileText } from 'lucide-react';
import type { Citation, Source } from '../types';

export function Stat({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ source }: { source: Source }) {
  return (
    <span className={`status-badge ${source.status}`}>
      <span />
      {source.status === 'indexed' ? 'READY' : source.status.toUpperCase()}
    </span>
  );
}

export function sourceIcon(kind: string, size = 22) {
  if (kind === 'pptx') return <Layers3 size={size} />;
  if (['mp4', 'webm'].includes(kind)) return <Video size={size} />;
  return <FileText size={size} />;
}

export function SourceCard({ source, onOpen }: { source: Source; onOpen: () => void }) {
  return (
    <button className="source-card" onClick={onOpen} disabled={['queued', 'extracting'].includes(source.status)}>
      <div className="source-card-top">
        <span className={`file-icon ${source.kind}`}>{sourceIcon(source.kind)}</span>
        <ArrowUpRight size={17} />
      </div>
      <strong>{source.name}</strong>
      <small>{source.kind.toUpperCase()} · {source.unit_count} units</small>
      <StatusBadge source={source} />
    </button>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <span className="next-icon"><BookOpen size={26} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function CitationList({ items, onOpen }: { items: Citation[]; onOpen: (c: Citation) => void }) {
  if (!items.length) return null;
  return (
    <div className="citations">
      {items.map((c, i) => (
        <button key={c.id} onClick={() => onOpen(c)} title={c.source_name}>
          <BookOpen size={13} /> {i + 1} · {c.location}
          <ArrowUpRight size={13} />
        </button>
      ))}
    </div>
  );
}
