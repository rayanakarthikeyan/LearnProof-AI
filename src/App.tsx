import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, CircleHelp, Loader2, Network, X } from 'lucide-react';
import type {
  Chat,
  Citation,
  Feedback,
  Health,
  Named,
  Progress,
  Question,
  Source,
  Tab,
} from './types';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Modals } from './components/Modals';
import { OverviewTab } from './components/tabs/OverviewTab';
import { LibraryTab } from './components/tabs/LibraryTab';
import { TutorTab } from './components/tabs/TutorTab';
import { PracticeTab } from './components/tabs/PracticeTab';
import { ProgressTab } from './components/tabs/ProgressTab';
import { EvaluationTab } from './components/tabs/EvaluationTab';

const EMPTY_PROGRESS: Progress = {
  topics: [],
  attempts: [],
  total_attempts: 0,
  scored_attempts: 0,
  correct_attempts: 0,
  observed_topics: 0,
  estimate_note: '',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('learnproof-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [health, setHealth] = useState<Health | null>(null);
  const [courses, setCourses] = useState<Named[]>([]);
  const [course, setCourse] = useState('data-structures');
  const [learners, setLearners] = useState<Named[]>([]);
  const [learner, setLearner] = useState(
    () => localStorage.getItem('learnproof-learner') || 'local-learner'
  );
  const [sources, setSources] = useState<Source[]>([]);
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Viewer
  const [viewer, setViewer] = useState<Citation | null>(null);
  const [viewUnits, setViewUnits] = useState<Citation[]>([]);
  const [modal, setModal] = useState<'help' | 'course' | 'learner' | 'workspace' | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tutor
  const [query, setQuery] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  // Practice & Diagnostic
  const [topic, setTopic] = useState('complexity');
  const [kind, setKind] = useState('mcq');
  const [adaptive, setAdaptive] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectionReason, setSelectionReason] = useState('');
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [practiceBusy, setPracticeBusy] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState<number | null>(null);
  const [repairTarget, setRepairTarget] = useState<string | null>(null);

  // Library & Evaluation
  const [search, setSearch] = useState('');
  const [evaluation, setEvaluation] = useState<Record<string, unknown> | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const requestEpoch = useRef(0);

  // Apply data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('learnproof-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const api = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const result = await fetch('/api' + path, {
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          'X-Learner-ID': learner,
          ...options.headers,
        },
      });
      if (!result.ok) {
        const body = await result.json().catch(() => ({}));
        throw new Error(body.detail || 'Could not complete the request. Check the local API.');
      }
      return result.json();
    },
    [learner]
  );

  const refresh = useCallback(async () => {
    const epoch = requestEpoch.current;
    const [nextSources, nextProgress] = await Promise.all([
      api<Source[]>(`/courses/${course}/sources`),
      api<Progress>(`/courses/${course}/progress`),
    ]);
    if (epoch === requestEpoch.current) {
      setSources(nextSources);
      setProgress(nextProgress);
    }
  }, [api, course]);

  // Initial load and course change
  useEffect(() => {
    let alive = true;
    requestEpoch.current += 1;
    setLoading(true);
    setQuestion(null);
    setFeedback(null);
    setDiagnosticStep(null);
    setRepairTarget(null);
    setViewer(null);

    Promise.all([
      api<Health>('/health'),
      api<Named[]>('/courses'),
      api<Named[]>('/learners'),
      api<Chat[]>(`/courses/${course}/chats`),
      refresh(),
    ])
      .then(([h, c, l, history]) => {
        if (alive) {
          setHealth(h);
          setCourses(c);
          setLearners(l);
          setChats(history);
          setError('');
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [api, course, refresh]);

  // Poll for document extraction progress
  useEffect(() => {
    if (!sources.some((s) => ['queued', 'extracting'].includes(s.status))) return;
    const timer = window.setInterval(() => refresh().catch((e) => setError(e.message)), 2000);
    return () => clearInterval(timer);
  }, [sources, refresh]);

  // Scroll chat to bottom
  useEffect(() => {
    if (tab === 'tutor') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chats, chatBusy, tab]);

  // Modal keyboard handling (Escape & focus trapping)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewer(null);
        setModal(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!viewer && !modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, select, textarea'
        ) || []
      );
    const elements = focusables();
    (elements.find((el) => el.tagName === 'INPUT') || elements[0])?.focus();
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, [Boolean(viewer), modal]);

  // Evaluation load
  useEffect(() => {
    if (tab === 'evaluation') {
      api<Record<string, unknown>>(`/courses/${course}/evaluation`)
        .then(setEvaluation)
        .catch((e) => setError(e.message));
    }
  }, [tab, course, api]);

  // Source Actions
  const openSource = async (source: Source) => {
    try {
      const units = await api<Citation[]>(`/sources/${source.id}/units`);
      if (!units.length) {
        setError(source.error || 'This source has no indexed content yet.');
        return;
      }
      setViewUnits(units);
      setViewer(units[0]);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openCitation = (citation: Citation) => {
    setViewUnits([]);
    setViewer(citation);
  };

  const upload = async (files: FileList | File[]) => {
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        await api(`/courses/${course}/sources`, { method: 'POST', body: form });
      }
      await refresh();
      setTab('library');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = '';
    }
  };

  const retrySource = (source: Source) => {
    api(`/sources/${source.id}/retry`, { method: 'POST' })
      .then(refresh)
      .catch((e) => setError(e.message));
  };

  // Chat Actions
  const sendChat = async (e?: FormEvent, preset?: string) => {
    e?.preventDefault();
    const message = (preset || query).trim();
    if (message.length < 3 || chatBusy) return;
    setChatBusy(true);
    setError('');
    const epoch = requestEpoch.current;
    try {
      await api(`/courses/${course}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question: message }),
      });
      const history = await api<Chat[]>(`/courses/${course}/chats`);
      if (epoch === requestEpoch.current) {
        setChats(history);
        setQuery('');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChatBusy(false);
    }
  };

  // Practice Actions
  const getQuestion = async (
    target = topic,
    format = kind,
    adapt = adaptive,
    reasonPrefix = ''
  ) => {
    setPracticeBusy(true);
    setError('');
    setFeedback(null);
    setResponse('');
    const epoch = requestEpoch.current;
    try {
      const result = await api<{ question: Question | null; reason: string }>(
        `/courses/${course}/practice`,
        { method: 'POST', body: JSON.stringify({ concept: target, kind: format, adaptive: adapt }) }
      );
      if (epoch === requestEpoch.current) {
        setQuestion(result.question);
        setSelectionReason(reasonPrefix + result.reason);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPracticeBusy(false);
    }
  };

  const startDiagnostic = () => {
    setTab('practice');
    setDiagnosticStep(0);
    setRepairTarget(null);
    setKind('mcq');
    setTopic('pointers');
    void getQuestion('pointers', 'mcq', false);
  };

  const submitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!question || !response.trim()) return;
    setPracticeBusy(true);
    setError('');
    const epoch = requestEpoch.current;
    try {
      const result = await api<Feedback>(`/questions/${question.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer: response }),
      });
      if (epoch === requestEpoch.current) {
        setFeedback(result);
        await refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPracticeBusy(false);
    }
  };

  const nextPractice = () => {
    if (diagnosticStep != null) {
      const step = diagnosticStep + 1;
      if (step >= 3) {
        setDiagnosticStep(null);
        setQuestion(null);
        setFeedback(null);
        setTab('progress');
        return;
      }
      const target = ['pointers', 'traversal', 'complexity'][step];
      setDiagnosticStep(step);
      setTopic(target);
      void getQuestion(target, 'mcq', false);
    } else if (feedback?.correct === false && question) {
      const probe =
        question.concept === 'complexity'
          ? 'traversal'
          : ['insertion', 'traversal'].includes(question.concept)
          ? 'pointers'
          : question.concept;
      const format = ['stacks', 'queues'].includes(probe) ? 'short' : 'mcq';
      setRepairTarget(repairTarget || question.concept);
      setTopic(probe);
      setKind(format);
      setAdaptive(false);
      void getQuestion(
        probe,
        format,
        false,
        'Diagnostic follow-up: check the possible gap before drawing a conclusion. '
      );
    } else if (repairTarget) {
      const transfer = repairTarget;
      setRepairTarget(null);
      setTopic(transfer);
      setKind('mcq');
      setAdaptive(false);
      void getQuestion(
        transfer,
        'mcq',
        false,
        'Transfer check: try your original topic under different conditions. '
      );
    } else {
      void getQuestion();
    }
  };

  const addNamed = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await api<Named>(modal === 'course' ? '/courses' : '/learners', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (modal === 'course') {
        setCourse(result.id);
      } else {
        localStorage.setItem('learnproof-learner', result.id);
        setLearner(result.id);
      }
      setModal(null);
      setNewName('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const weakest = [...progress.topics].sort((a, b) => a.estimate - b.estimate)[0];
  const courseName =
    courses.find((c) => c.id === course)?.name || 'Data Structures Foundations';
  const indexed = sources.filter((s) => s.status === 'indexed');
  const filteredSources = sources.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const observed = progress.topics.filter((t) => t.observations > 0);
  const average = observed.length
    ? Math.round((observed.reduce((sum, t) => sum + t.estimate, 0) / observed.length) * 100)
    : null;

  return (
    <div className="app-shell">
      <Sidebar
        tab={tab}
        setTab={setTab}
        courses={courses}
        course={course}
        setCourse={setCourse}
        learners={learners}
        learner={learner}
        setLearner={setLearner}
        sources={sources}
        onOpenModal={(m) => {
          setModal(m);
          setNewName('');
        }}
      />

      <main className="main-shell">
        <TopBar
          tab={tab}
          health={health}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenModal={setModal}
        />

        <div className="page-content">
          {error && (
            <div className="error-banner" role="alert">
              <CircleHelp size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <Loader2 className="spin" size={24} />
              <p>Opening your learning space…</p>
              <small>Make sure the local API is running on port 8000.</small>
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <OverviewTab
                  progress={progress}
                  sources={sources}
                  indexed={indexed}
                  average={average}
                  weakest={weakest}
                  uploading={uploading}
                  onSetTab={setTab}
                  onStartDiagnostic={startDiagnostic}
                  onSelectTopic={(t) => {
                    setTopic(t);
                    void getQuestion(t);
                  }}
                  onOpenSource={openSource}
                  onTriggerUpload={() => uploadRef.current?.click()}
                />
              )}

              {tab === 'library' && (
                <LibraryTab
                  sources={sources}
                  filteredSources={filteredSources}
                  search={search}
                  setSearch={setSearch}
                  health={health}
                  uploading={uploading}
                  onUploadFiles={upload}
                  onOpenSource={openSource}
                  onRetrySource={retrySource}
                  onOpenHelpModal={() => setModal('help')}
                  onTriggerUpload={() => uploadRef.current?.click()}
                />
              )}

              {tab === 'tutor' && (
                <TutorTab
                  health={health}
                  courseName={courseName}
                  indexed={indexed}
                  chats={chats}
                  query={query}
                  setQuery={setQuery}
                  chatBusy={chatBusy}
                  chatEndRef={chatEndRef}
                  onSendChat={sendChat}
                  onOpenSource={openSource}
                  onOpenCitation={openCitation}
                />
              )}

              {tab === 'practice' && (
                <PracticeTab
                  diagnosticStep={diagnosticStep}
                  topic={topic}
                  setTopic={setTopic}
                  kind={kind}
                  setKind={setKind}
                  adaptive={adaptive}
                  setAdaptive={setAdaptive}
                  question={question}
                  selectionReason={selectionReason}
                  response={response}
                  setResponse={setResponse}
                  feedback={feedback}
                  repairTarget={repairTarget}
                  practiceBusy={practiceBusy}
                  progress={progress}
                  onGetQuestion={getQuestion}
                  onStartDiagnostic={startDiagnostic}
                  onSubmitAnswer={submitAnswer}
                  onNextPractice={nextPractice}
                  onOpenCitation={openCitation}
                />
              )}

              {tab === 'progress' && (
                <ProgressTab
                  progress={progress}
                  weakest={weakest}
                  onSetTab={setTab}
                  onSelectTopic={(t) => {
                    setTopic(t);
                    void getQuestion(t);
                  }}
                  onStartDiagnostic={startDiagnostic}
                />
              )}

              {tab === 'evaluation' && <EvaluationTab evaluation={evaluation} />}

              <footer className="page-footer">
                <span>
                  <Network size={13} /> LearnProof AI
                </span>
                <span>Find the gap. Follow the evidence. Grow.</span>
                <a
                  href="https://github.com/rayanakarthikeyan/LearnProof-AI"
                  target="_blank"
                  rel="noreferrer"
                >
                  Project source <ArrowUpRight size={13} />
                </a>
              </footer>
            </>
          )}
        </div>
      </main>

      <input
        ref={uploadRef}
        className="visually-hidden"
        type="file"
        accept=".pdf,.pptx,.mp4,.webm"
        multiple
        aria-label="Upload course material"
        onChange={(e) => e.target.files && void upload(e.target.files)}
      />

      <Modals
        viewer={viewer}
        setViewer={setViewer}
        viewUnits={viewUnits}
        modal={modal}
        setModal={setModal}
        health={health}
        courses={courses}
        course={course}
        setCourse={setCourse}
        learners={learners}
        learner={learner}
        setLearner={setLearner}
        newName={newName}
        setNewName={setNewName}
        saving={saving}
        onAddNamed={addNamed}
      />
    </div>
  );
}
