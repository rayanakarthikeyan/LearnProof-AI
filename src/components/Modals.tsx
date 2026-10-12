import React, { useRef } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Loader2, Plus, X } from 'lucide-react';
import type { Citation, Health, Named } from '../types';
import { EmptyState } from './Common';

interface ModalsProps {
  viewer: Citation | null;
  setViewer: (c: Citation | null) => void;
  viewUnits: Citation[];
  modal: 'help' | 'course' | 'learner' | 'workspace' | null;
  setModal: (m: 'help' | 'course' | 'learner' | 'workspace' | null) => void;
  health: Health | null;
  courses: Named[];
  course: string;
  setCourse: (c: string) => void;
  learners: Named[];
  learner: string;
  setLearner: (l: string) => void;
  newName: string;
  setNewName: (name: string) => void;
  saving: boolean;
  onAddNamed: (e: React.FormEvent) => void;
}

export function Modals({
  viewer,
  setViewer,
  viewUnits,
  modal,
  setModal,
  health,
  courses,
  course,
  setCourse,
  learners,
  learner,
  setLearner,
  newName,
  setNewName,
  saving,
  onAddNamed,
}: ModalsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <>
      {/* Evidence Viewer Modal */}
      {viewer && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewer(null);
          }}
        >
          <section
            className="source-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Source evidence viewer"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">ORIGINAL COURSE EVIDENCE</span>
                <h2>{viewer.source_name}</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close source viewer"
                onClick={() => setViewer(null)}
              >
                <X size={21} />
              </button>
            </div>
            <div className="source-modal-body">
              <div className="source-preview">
                {viewUnits.length > 1 && (
                  <select
                    aria-label="Source location"
                    value={viewer.id}
                    onChange={(e) =>
                      setViewer(viewUnits.find((u) => u.id === e.target.value) || null)
                    }
                  >
                    {viewUnits.map((u) => (
                      <option value={u.id} key={u.id}>
                        {u.location}
                      </option>
                    ))}
                  </select>
                )}
                {['mp4', 'webm'].includes(viewer.kind) ? (
                  <video
                    ref={videoRef}
                    controls
                    src={viewer.original_url}
                    onLoadedMetadata={(e) => {
                      if (viewer.start != null) e.currentTarget.currentTime = viewer.start;
                    }}
                  />
                ) : viewer.image_url ? (
                  <img
                    src={viewer.image_url}
                    alt={`${viewer.source_name}, ${viewer.location}`}
                  />
                ) : (
                  <EmptyState
                    title="Preview unavailable"
                    text="Open the original source to inspect this location."
                  />
                )}
              </div>
              <aside className="source-excerpt">
                <span className="badge-soft">
                  <BookOpen size={14} />
                  {viewer.location}
                </span>
                <h3>Read it in context.</h3>
                <p>{viewer.excerpt}</p>
                {viewer.visual && (
                  <>
                    <h4>Extracted visual information</h4>
                    <p>{viewer.visual}</p>
                  </>
                )}
                {viewer.kind === 'pptx' && !viewer.extraction?.includes('rendered-slide') && (
                  <div className="info-note small">
                    This is an approximate structural preview. Open the original slide deck for full fidelity.
                  </div>
                )}
                <a
                  className="button secondary"
                  href={viewer.original_url + (viewer.kind === 'pdf' ? `#page=${viewer.page}` : '')}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original {viewer.kind.toUpperCase()}
                  <ArrowUpRight size={16} />
                </a>
              </aside>
            </div>
          </section>
        </div>
      )}

      {/* Auxiliary Dialog Modals */}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className="small-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === 'help'
                ? 'How LearnProof works'
                : modal === 'workspace'
                ? 'Choose your learning space'
                : `Add ${modal}`
            }
          >
            <div className="modal-header">
              <h2>
                {modal === 'help'
                  ? 'Understanding, with evidence.'
                  : modal === 'workspace'
                  ? 'Choose your learning space'
                  : modal === 'course'
                  ? 'A new course space'
                  : 'A fresh learning profile'}
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            {modal === 'help' ? (
              <div className="help-content">
                <p>
                  Add course material, ask a source-bound question, and practice with cited
                  feedback. Only scored responses change your provisional mastery estimate.
                </p>
                <h3>{health?.provider_configured ? 'AI is connected' : 'Connect AI on the server'}</h3>
                <p>
                  {health?.provider_configured
                    ? `Configured model: ${health.model}. Live provider behavior still needs a successful real request.`
                    : 'Local mode selects exact document excerpts and uses authored practice. To enable visual interpretation, video ingestion and generated explanations, configure the server.'}
                </p>
                {!health?.provider_configured && (
                  <>
                    <div className="code-note">
                      Copy .env.example to .env<br />
                      Set GEMINI_API_KEY in .env<br />
                      Restart the Python API
                    </div>
                    <p className="muted">
                      Keep the key in the server environment. Do not paste it into this page or
                      commit it to GitHub. Uploading in AI mode sends course content to Gemini.
                    </p>
                  </>
                )}
                <p className="muted">
                  This is a local prototype with separate learning profiles, not an authenticated
                  multi-user service. Sample sources are original authored material. No benchmark
                  scores are prefilled.
                </p>
              </div>
            ) : modal === 'workspace' ? (
              <div className="workspace-form">
                <label>
                  Course
                  <select
                    aria-label="Mobile course"
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setModal(null);
                    }}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Learning profile
                  <select
                    aria-label="Mobile learning profile"
                    value={learner}
                    onChange={(e) => {
                      localStorage.setItem('learnproof-learner', e.target.value);
                      setLearner(e.target.value);
                      setModal(null);
                    }}
                  >
                    {learners.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="workspace-buttons">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setModal('course');
                      setNewName('');
                    }}
                  >
                    <Plus size={16} /> Add course
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setModal('learner');
                      setNewName('');
                    }}
                  >
                    <Plus size={16} /> Add profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onAddNamed} className="name-form">
                <label>
                  {modal === 'course' ? 'Course name' : 'Profile name'}
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    minLength={2}
                    maxLength={80}
                    placeholder={modal === 'course' ? 'e.g. Algorithms, Unit 1' : 'e.g. Practice profile'}
                    required
                  />
                </label>
                <p className="muted">
                  {modal === 'course'
                    ? 'Start with an empty library and add your own materials. The prototype currently uses a Data Structures topic taxonomy.'
                    : 'A separate local response history and mastery estimate. This does not create an account.'}
                </p>
                <button
                  className="button primary"
                  disabled={saving || newName.trim().length < 2}
                >
                  {saving && <Loader2 className="spin" size={16} />}
                  Create {modal}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
