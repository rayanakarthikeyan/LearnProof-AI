import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Leaf,
  Loader2,
  MessageSquareText,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import type {
  Chat,
  Citation,
  Feedback,
  Health,
  Named,
  Progress,
  Question,
  Source,
  Topic,
  Repair,
} from "./types";

import ExamView from "./ExamView";
import Readiness from "./Readiness";
import { ConceptMap, RevisionCards } from "./ConceptMap";

type Tab =
  | "exam"
  | "overview"
  | "library"
  | "tutor"
  | "practice"
  | "progress"
  | "evaluation";
const NAV = [
  ["overview", "Overview", LayoutDashboard],
  ["library", "Course library", FolderOpen],
  ["tutor", "Evidence tutor", MessageSquareText],
  ["practice", "Practice & repair", Target],
  ["exam", "Mock exams", GraduationCap],
  ["progress", "My understanding", TrendingUp],
  ["evaluation", "Evaluation", FlaskConical],
] as const;
const EMPTY: Progress = {
  topics: [],
  attempts: [],
  total_attempts: 0,
  scored_attempts: 0,
  correct_attempts: 0,
  observed_topics: 0,
  estimate_note: "",
};

export default function App() {
  const [tab, setTab] = useState<Tab>(
    (localStorage.getItem("learnproof-tab") as Tab) || "overview",
  );
  const [health, setHealth] = useState<Health | null>(null);
  const [courses, setCourses] = useState<Named[]>([]);
  const [course, setCourse] = useState(
    localStorage.getItem("learnproof-course") || "data-structures",
  );
  const [learners, setLearners] = useState<Named[]>([]);
  const [learner, setLearner] = useState(
    localStorage.getItem("learnproof-learner") || "local-learner",
  );
  const [sources, setSources] = useState<Source[]>([]);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<Citation | null>(null);
  const [viewUnits, setViewUnits] = useState<Citation[]>([]);
  const [modal, setModal] = useState<
    "help" | "course" | "learner" | "workspace" | null
  >(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [topic, setTopic] = useState("complexity");
  const [kind, setKind] = useState("mcq");
  const [adaptive, setAdaptive] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectionReason, setSelectionReason] = useState("");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [practiceBusy, setPracticeBusy] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState<number | null>(null);
  const [repairTarget, setRepairTarget] = useState<string | null>(null);
  const [repairStage, setRepairStage] = useState<string | null>(null);
  const [revision, setRevision] = useState<
    { topic: Topic; excerpt: string; citation: Citation; prompt: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const [evaluation, setEvaluation] = useState<Record<string, unknown> | null>(
    null,
  );
  const uploadRef = useRef<HTMLInputElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestEpoch = useRef(0);

  const api = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const result = await fetch("/api" + path, {
        ...options,
        headers: {
          ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          "X-Learner-ID": learner,
          ...options.headers,
        },
      });
      if (!result.ok) {
        const body = await result.json().catch(() => ({}));
        throw new Error(
          body.detail || "Could not complete the request. Check the local API.",
        );
      }
      return result.json();
    },
    [learner],
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
      setTopic((previous) =>
        nextProgress.topics.some((t) => t.id === previous)
          ? previous
          : nextProgress.topics[0]?.id || "",
      );
    }
  }, [api, course]);

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
      api<Health>("/health"),
      api<Named[]>("/courses"),
      api<Named[]>("/learners"),
      api<Chat[]>(`/courses/${course}/chats`),
      refresh(),
      api<Repair | null>(`/courses/${course}/repair`),
    ])
      .then(([h, c, l, history, _, repair]) => {
        if (alive) {
          setHealth(h);
          setCourses(c);
          setLearners(l);
          setChats(history);
          setError("");
          if (repair) {
            setRepairTarget(repair.target);
            setRepairStage(repair.stage);
            setQuestion(repair.question);
            setFeedback(repair.feedback);
            setTopic(repair.probe);
            setKind(repair.question?.kind || "mcq");
            setSelectionReason(
              repair.stage === "transfer"
                ? "Resumed unseen transfer check."
                : "Resumed diagnostic follow-up.",
            );
          }
        }
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [api, course, refresh]);

  useEffect(() => {
    if (!sources.some((s) => ["queued", "extracting"].includes(s.status)))
      return;
    const timer = window.setInterval(
      () => refresh().catch((e) => setError(e.message)),
      2000,
    );
    return () => clearInterval(timer);
  }, [sources, refresh]);
  useEffect(() => {
    if (tab === "tutor")
      chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chats, chatBusy, tab]);
  useEffect(() => {
    if (viewer?.start != null && videoRef.current)
      videoRef.current.currentTime = viewer.start;
  }, [viewer]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewer(null);
        setModal(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!viewer && !modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input, select, textarea",
        ) || [],
      );
    const elements = focusables();
    (
      elements.find((element) => element.tagName === "INPUT") || elements[0]
    )?.focus();
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      const first = items[0],
        last = items[items.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, [Boolean(viewer), modal]);
  useEffect(() => {
    if (tab === "evaluation")
      api<Record<string, unknown>>(`/courses/${course}/evaluation`)
        .then(setEvaluation)
        .catch((e) => setError(e.message));
  }, [tab, course, api]);

  useEffect(() => {
    localStorage.setItem("learnproof-course", course);
  }, [course]);
  useEffect(() => {
    localStorage.setItem("learnproof-tab", tab);
  }, [tab]);
  useEffect(() => {
    if (tab === "progress")
      api<typeof revision>(`/courses/${course}/revision`)
        .then(setRevision)
        .catch((e) => setError(e.message));
  }, [tab, course, api, progress.scored_attempts]);

  const openSource = async (source: Source) => {
    try {
      const units = await api<Citation[]>(`/sources/${source.id}/units`);
      if (!units.length) {
        setError(source.error || "This source has no indexed content yet.");
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
    setError("");
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        await api(`/courses/${course}/sources`, { method: "POST", body: form });
      }
      await refresh();
      setTab("library");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };
  const sendChat = async (e?: FormEvent, preset?: string) => {
    e?.preventDefault();
    const message = (preset || query).trim();
    if (message.length < 3 || chatBusy) return;
    setChatBusy(true);
    setError("");
    const epoch = requestEpoch.current;
    try {
      await api(`/courses/${course}/chat`, {
        method: "POST",
        body: JSON.stringify({ question: message }),
      });
      const history = await api<Chat[]>(`/courses/${course}/chats`);
      if (epoch === requestEpoch.current) {
        setChats(history);
        setQuery("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChatBusy(false);
    }
  };
  const getQuestion = async (
    target = topic,
    format = kind,
    adapt = adaptive,
    reasonPrefix = "",
  ) => {
    setPracticeBusy(true);
    setError("");
    setFeedback(null);
    setResponse("");
    const epoch = requestEpoch.current;
    try {
      const result = await api<{ question: Question | null; reason: string }>(
        `/courses/${course}/practice`,
        {
          method: "POST",
          body: JSON.stringify({
            concept: target,
            kind: format,
            adaptive: adapt,
          }),
        },
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
  const diagnosticTopics =
    course === "data-structures"
      ? ["pointers", "traversal", "complexity"]
      : progress.topics.slice(0, 3).map((t) => t.id);
  const startDiagnostic = () => {
    if (!diagnosticTopics.length) {
      setTab("library");
      setError("Add course material before starting a diagnostic.");
      return;
    }
    void api(`/courses/${course}/repair/stop`, { method: "POST" });
    setTab("practice");
    setDiagnosticStep(0);
    setRepairTarget(null);
    setRepairStage(null);
    setKind("mcq");
    setTopic(diagnosticTopics[0]);
    void getQuestion(diagnosticTopics[0], "mcq", false);
  };
  const submitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!question || !response.trim()) return;
    setPracticeBusy(true);
    setError("");
    const epoch = requestEpoch.current;
    try {
      const result = await api<Feedback>(`/questions/${question.id}/answer`, {
        method: "POST",
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
  const advanceRepair = async (failed?: string) => {
    setPracticeBusy(true);
    setError("");
    try {
      const repair = await api<Repair>(`/courses/${course}/repair`, {
        method: "POST",
        body: JSON.stringify(failed ? { failed_question: failed } : {}),
      });
      setResponse("");
      setQuestion(repair.question);
      setFeedback(repair.feedback || null);
      setRepairTarget(repair.stage === "complete" ? null : repair.target);
      setRepairStage(repair.stage);
      if (repair.question) {
        setTopic(repair.question.concept);
        setKind(repair.question.kind);
        setAdaptive(false);
      }
      setSelectionReason(
        repair.stage === "complete"
          ? repair.message || "Repair complete."
          : repair.stage === "transfer"
            ? "Transfer check: try the original topic under different conditions."
            : "Diagnostic follow-up: check the possible gap before drawing a conclusion.",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPracticeBusy(false);
    }
  };
  const nextPractice = () => {
    if (diagnosticStep != null) {
      const step = diagnosticStep + 1;
      if (step >= diagnosticTopics.length) {
        setDiagnosticStep(null);
        setQuestion(null);
        setFeedback(null);
        setTab("progress");
        return;
      }
      const target = diagnosticTopics[step];
      setDiagnosticStep(step);
      setTopic(target);
      void getQuestion(target, "mcq", false);
    } else if (repairTarget) void advanceRepair();
    else if (feedback?.correct === false && question)
      void advanceRepair(question.id);
    else void getQuestion();
  };
  const checkConversation = async (chatId: string) => {
    setPracticeBusy(true);
    setError("");
    try {
      const result = await api<{ question: Question | null; reason: string }>(
        `/chats/${chatId}/check`,
        { method: "POST" },
      );
      setQuestion(result.question);
      setFeedback(null);
      setResponse("");
      setDiagnosticStep(null);
      setRepairTarget(null);
      setSelectionReason("Check after tutoring: " + result.reason);
      setTab("practice");
      if (result.question) {
        setTopic(result.question.concept);
        setKind(result.question.kind);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPracticeBusy(false);
    }
  };
  const addNamed = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await api<Named>(
        modal === "course" ? "/courses" : "/learners",
        { method: "POST", body: JSON.stringify({ name: newName.trim() }) },
      );
      if (modal === "course") setCourse(result.id);
      else {
        localStorage.setItem("learnproof-learner", result.id);
        setLearner(result.id);
      }
      setModal(null);
      setNewName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const weakest = [...progress.topics].sort(
    (a, b) => a.estimate - b.estimate,
  )[0];
  const courseName =
    courses.find((c) => c.id === course)?.name || "Data Structures Foundations";
  const indexed = sources.filter((s) => s.status === "indexed");
  const filteredSources = sources.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const observed = progress.topics.filter((t) => t.observations > 0);
  const average = observed.length
    ? Math.round(
        (observed.reduce((sum, t) => sum + t.estimate, 0) / observed.length) *
          100,
      )
    : null;
  const sourceIcon = (kind: string, size = 22) =>
    kind === "pptx" ? (
      <Layers3 size={size} />
    ) : ["mp4", "webm"].includes(kind) ? (
      <Video size={size} />
    ) : (
      <FileText size={size} />
    );
  const citations = (items: Citation[]) => (
    <div className="citations">
      {items.map((c, i) => (
        <button
          key={c.id}
          onClick={() => openCitation(c)}
          title={c.source_name}
        >
          <BookOpen size={13} /> {i + 1} · {c.location}
          <ArrowUpRight size={13} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("overview");
          }}
          aria-label="LearnProof overview"
        >
          <span className="brand-symbol">
            <Network size={25} />
          </span>
          <span>
            learnproof<span className="brand-dot">.</span>
            <small>UNDERSTANDING, VERIFIED</small>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {NAV.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {tab === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-course">
          <span className="tiny-label">CURRENT COURSE</span>
          <div className="course-mini">
            <span className="course-icon">
              <GraduationCap size={20} />
            </span>
            <span>
              {courseName}
              <small>{indexed.length} indexed sources</small>
            </span>
          </div>
          <select
            aria-label="Select course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            className="text-button"
            onClick={() => {
              setModal("course");
              setNewName("");
            }}
          >
            <Plus size={15} /> Add a course
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="quiet-note">
            <Leaf size={19} />
            <span>
              Small steps.
              <br />
              <strong>Deeper understanding.</strong>
            </span>
          </div>
          <div className="profile-block">
            <span className="avatar">
              {(learners.find((l) => l.id === learner)?.name || "My").slice(
                0,
                1,
              )}
            </span>
            <select
              aria-label="Learning profile"
              value={learner}
              onChange={(e) => {
                localStorage.setItem("learnproof-learner", e.target.value);
                setLearner(e.target.value);
              }}
            >
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              className="icon-button"
              aria-label="Add learning profile"
              onClick={() => {
                setModal("learner");
                setNewName("");
              }}
            >
              <Plus size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            My workspace <ChevronRight size={13} />
            <strong>{NAV.find((n) => n[0] === tab)?.[1]}</strong>
          </div>
          <div className="top-actions">
            <span
              className={`mode-pill ${health?.provider_configured ? "live" : ""}`}
            >
              <span />
              {health?.provider_configured
                ? "AI configured"
                : "Local evidence mode"}
            </span>
            <button
              className="icon-button"
              aria-label="How LearnProof works"
              onClick={() => setModal("help")}
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="icon-button mobile-scope"
              aria-label="Choose course and learning profile"
              onClick={() => setModal("workspace")}
            >
              <GraduationCap size={19} />
            </button>
          </div>
        </header>
        <div className="page-content">
          {error && (
            <div className="error-banner" role="alert">
              <CircleHelp size={18} />
              <span>{error}</span>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
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
              {tab === "overview" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">A LITTLE CLEARER, EVERY DAY</div>
                      <h1>
                        Build understanding.
                        <br className="mobile-break" /> Keep the proof.
                      </h1>
                      <p>
                        Your material, your learning path. Let’s find the next
                        step that matters.
                      </p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setTab("library");
                        uploadRef.current?.click();
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
                          ? "Turn a weak spot into\na moment of clarity."
                          : "Knowing where you’re stuck\nis where progress begins."}
                      </h2>
                      <p>
                        {progress.scored_attempts
                          ? `Revisit ${weakest?.name.toLowerCase() || "a weak topic"}, see the original evidence, then try a different problem.`
                          : "A short check helps us understand what you know — and what to explore together."}
                      </p>
                      <button
                        className="button light"
                        onClick={
                          progress.scored_attempts
                            ? () => {
                                setTab("practice");
                                setTopic(weakest?.id || "pointers");
                                void getQuestion(weakest?.id || "pointers");
                              }
                            : startDiagnostic
                        }
                      >
                        {progress.scored_attempts
                          ? "Continue my learning path"
                          : "Check my understanding"}
                        <ArrowRight size={17} />
                      </button>
                      <span className="hero-foot">
                        <Clock3 size={13} />
                        {progress.scored_attempts
                          ? "One focused topic at a time"
                          : "3 questions · A starting point, not a grade"}
                      </span>
                    </div>
                    <div className="hero-visual" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <div className="diagram-label label-one">
                        FIND THE GAP
                      </div>
                      <div className="diagram-label label-two">
                        FOLLOW THE EVIDENCE
                      </div>
                      <div className="diagram-label label-three">
                        TRY SOMETHING NEW
                      </div>
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
                      value={String(indexed.length).padStart(2, "0")}
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
                      value={String(progress.total_attempts).padStart(2, "0")}
                      detail={`${progress.scored_attempts} scored responses`}
                      icon={<CheckCircle2 size={19} />}
                    />
                    <Stat
                      label="Mastery estimate"
                      value={average == null ? "—" : `${average}%`}
                      detail={
                        average == null
                          ? "Start with a short check"
                          : "Provisional · observed topics"
                      }
                      icon={<TrendingUp size={19} />}
                    />
                  </div>
                  <div className="overview-grid">
                    <section className="panel path-panel">
                      <SectionHeader
                        eyebrow="ONE CONCEPT AT A TIME"
                        title="Your learning path"
                        action={
                          <button
                            className="text-button"
                            onClick={() => setTab("progress")}
                          >
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
                              setTab("practice");
                              setTopic(t.id);
                              void getQuestion(t.id);
                            }}
                          >
                            <span
                              className={`path-step ${t.observations ? "observed" : ""}`}
                            >
                              {t.observations ? (
                                <Check size={16} />
                              ) : (
                                `0${i + 1}`
                              )}
                            </span>
                            <span>
                              <strong>{t.name}</strong>
                              <small>
                                {t.observations
                                  ? `${Math.round(t.estimate * 100)}% estimate · ${t.observations} checks`
                                  : "Not checked yet"}
                              </small>
                            </span>
                            <ChevronRight size={17} />
                          </button>
                        ))}
                      </div>
                      <div className="panel-footnote">
                        <ShieldCheck size={15} />
                        Progress follows your responses, not time spent on a
                        page.
                      </div>
                    </section>
                    <section className="panel evidence-panel">
                      <span className="badge-soft">
                        <ShieldCheck size={15} /> EVERY ANSWER HAS A PLACE
                      </span>
                      <h3>
                        Don’t just take
                        <br />
                        our word for it.
                      </h3>
                      <p>
                        Open the exact page, slide or video moment behind an
                        explanation.
                      </p>
                      <div className="mini-source">
                        <span className="file-icon pdf">
                          <FileText size={20} />
                        </span>
                        <div>
                          <strong>Your course, in context</strong>
                          <small>Original source · inspectable evidence</small>
                        </div>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setTab("tutor")}
                      >
                        Ask the evidence tutor <ArrowRight size={16} />
                      </button>
                    </section>
                  </div>
                  <section className="materials-section">
                    <SectionHeader
                      title="On your bookshelf"
                      action={
                        <button
                          className="text-button"
                          onClick={() => setTab("library")}
                        >
                          Open library <ArrowRight size={14} />
                        </button>
                      }
                    />
                    <div className="source-grid">
                      {sources.slice(0, 3).map((s) => (
                        <SourceCard
                          key={s.id}
                          source={s}
                          onOpen={() => void openSource(s)}
                          icon={sourceIcon(s.kind)}
                        />
                      ))}
                      <button
                        className="source-add"
                        onClick={() => uploadRef.current?.click()}
                        disabled={uploading}
                      >
                        <UploadCloud size={23} />
                        <strong>Make it your course</strong>
                        <small>Add notes, slides or a lecture</small>
                      </button>
                    </div>
                  </section>
                </>
              )}

              {tab === "library" && (
                <>
                  <PageHeading
                    eyebrow="ONE HOME FOR YOUR MATERIAL"
                    title="Your course library"
                    subtitle="Bring the notes, slides and lectures. Keep their original context."
                  />
                  <div
                    className="upload-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void upload(e.dataTransfer.files);
                    }}
                  >
                    <span className="upload-icon">
                      <UploadCloud size={27} />
                    </span>
                    <div>
                      <h3>
                        {uploading
                          ? "Adding your material…"
                          : "Drop your next source here"}
                      </h3>
                      <p>
                        PDF · PPTX · MP4 · WebM{" "}
                        <span>
                          Documents up to 25 MB · Videos up to 100 MB / 10 min
                        </span>
                      </p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => uploadRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Plus size={16} />
                      )}{" "}
                      Choose files
                    </button>
                  </div>
                  {!health?.provider_configured && (
                    <div className="info-note">
                      <CircleHelp size={17} />
                      <span>
                        PDF and slide text can be indexed locally. Diagram
                        interpretation and lecture-video understanding need the
                        AI connection.
                      </span>
                      <button
                        className="text-button"
                        onClick={() => setModal("help")}
                      >
                        Set up AI <ArrowUpRight size={13} />
                      </button>
                    </div>
                  )}
                  <div className="section-header library-tools">
                    <h2>
                      Course material{" "}
                      <span className="count-pill">{sources.length}</span>
                    </h2>
                    <label className="search-box">
                      <Search size={16} />
                      <input
                        aria-label="Find a source"
                        placeholder="Find a source…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="library-list">
                    {filteredSources.map((s) => (
                      <div className="library-row" key={s.id}>
                        <span className={`file-icon ${s.kind}`}>
                          {sourceIcon(s.kind)}
                        </span>
                        <div className="source-info">
                          <h3>{s.name}</h3>
                          <p>
                            {s.kind.toUpperCase()} · {s.unit_count} source units
                          </p>
                          {s.warnings.length > 0 && (
                            <details>
                              <summary>Extraction notes</summary>
                              {s.warnings.map((w) => (
                                <p key={w}>{w}</p>
                              ))}
                            </details>
                          )}
                          {s.error && <p className="error-text">{s.error}</p>}
                        </div>
                        <Status source={s} />
                        <button
                          className="button secondary compact"
                          onClick={() =>
                            s.status === "failed"
                              ? api(`/sources/${s.id}/retry`, {
                                  method: "POST",
                                })
                                  .then(refresh)
                                  .catch((e) => setError(e.message))
                              : openSource(s)
                          }
                          disabled={["queued", "extracting"].includes(s.status)}
                        >
                          {s.status === "failed" ? "Retry" : "Open source"}
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    ))}
                    {!filteredSources.length && (
                      <Empty
                        title={
                          sources.length
                            ? "No matching sources"
                            : "Your course starts here"
                        }
                        text="Add a PDF, slide deck or lecture to create a searchable course library."
                      />
                    )}
                  </div>
                </>
              )}

              {tab === "tutor" && (
                <>
                  <PageHeading
                    eyebrow="FOLLOW THE EVIDENCE"
                    title="Let’s make it clearer."
                    subtitle="Ask about your course. Every source-backed statement has somewhere you can look."
                  />
                  <div className="tutor-layout">
                    <section className="panel chat-panel">
                      <div className="chat-panel-head">
                        <span className="tutor-avatar">
                          <Sparkles size={19} />
                        </span>
                        <div>
                          <strong>Evidence tutor</strong>
                          <small>
                            {health?.provider_configured
                              ? "Source-constrained explanations with support checks"
                              : "Local mode · exact source excerpts"}
                          </small>
                        </div>
                        <ShieldCheck size={19} />
                      </div>
                      <div className="chat-messages">
                        {!chats.length && (
                          <div className="chat-welcome">
                            <span className="welcome-orb">
                              <BookOpen size={30} />
                            </span>
                            <h2>A question is a good place to start.</h2>
                            <p>
                              Pick a concept, ask why a step works, or find the
                              evidence behind an answer.
                            </p>
                            <div className="suggested-questions">
                              {[
                                "Is every linked-list insertion O(1)?",
                                "How does linked-list traversal work?",
                                "What rule does a stack follow?",
                              ].map((q) => (
                                <button
                                  key={q}
                                  onClick={() => void sendChat(undefined, q)}
                                  disabled={chatBusy}
                                >
                                  {q}
                                  <ArrowUpRight size={15} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {chats.map((chat) => (
                          <div className="chat-exchange" key={chat.id}>
                            <div className="user-message">{chat.question}</div>
                            <div className="assistant-message">
                              <span className="small-tutor-icon">
                                <Sparkles size={16} />
                              </span>
                              <div>
                                <span className="message-mode">
                                  {chat.response.status === "unsupported"
                                    ? "SOURCE BOUNDARY"
                                    : chat.response.mode === "local-excerpts"
                                      ? "FROM YOUR MATERIAL"
                                      : "SOURCE-CHECKED EXPLANATION"}
                                </span>
                                {chat.response.claims.map((claim, index) => (
                                  <p key={index}>{claim.text}</p>
                                ))}
                                {citations(chat.response.citations)}
                                <div className="response-note">
                                  {chat.response.message}
                                </div>
                                {chat.response.status === "answered" && (
                                  <button
                                    className="text-button conversation-check"
                                    disabled={practiceBusy}
                                    onClick={() =>
                                      void checkConversation(chat.id)
                                    }
                                  >
                                    Check this understanding{" "}
                                    <ArrowRight size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {chatBusy && (
                          <div className="assistant-working">
                            <Loader2 size={17} className="spin" />
                            Looking through your course evidence…
                          </div>
                        )}
                        <div ref={chatEnd} />
                      </div>
                      <form className="chat-form" onSubmit={sendChat}>
                        <input
                          aria-label="Ask the evidence tutor"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="What would you like to understand?"
                          maxLength={2000}
                          disabled={chatBusy}
                        />
                        <button
                          className="send-button"
                          aria-label="Send question"
                          disabled={chatBusy || query.trim().length < 3}
                        >
                          <ArrowRight size={21} />
                        </button>
                      </form>
                      <div className="chat-disclaimer">
                        Outside the material? We’ll say so. Asking a question
                        alone does not change mastery.
                      </div>
                    </section>
                    <aside className="tutor-aside">
                      <div className="panel">
                        <span className="eyebrow">YOUR CONTEXT</span>
                        <h3>{courseName}</h3>
                        <p>
                          {indexed.length} indexed sources. Answers stay within
                          this course.
                        </p>
                        <div className="context-sources">
                          {indexed.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => void openSource(s)}
                            >
                              {sourceIcon(s.kind, 17)}
                              <span>{s.name}</span>
                              <ArrowUpRight size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="tutor-tip">
                        <ShieldCheck size={24} />
                        <h3>A citation is an invitation.</h3>
                        <p>
                          Open it. Check the diagram. Read the surrounding text.
                          Understanding should be inspectable.
                        </p>
                      </div>
                    </aside>
                  </div>
                </>
              )}

              {tab === "practice" && (
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
                        ? `Diagnostic check ${diagnosticStep + 1} of ${diagnosticTopics.length}. We use scored responses to make provisional topic estimates.`
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
                          onChange={(e) => {
                            setTopic(e.target.value);
                            setQuestion(null);
                            setFeedback(null);
                            setDiagnosticStep(null);
                            setRepairTarget(null);
                          }}
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
                          onChange={(e) => {
                            setKind(e.target.value);
                            setQuestion(null);
                            setFeedback(null);
                            setDiagnosticStep(null);
                            setRepairTarget(null);
                          }}
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
                        onClick={() => {
                          setDiagnosticStep(null);
                          setRepairTarget(null);
                          setRepairStage(null);
                          void api(`/courses/${course}/repair/stop`, {
                            method: "POST",
                          });
                          void getQuestion();
                        }}
                        disabled={practiceBusy || !topic}
                      >
                        {practiceBusy ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <Sparkles size={16} />
                        )}{" "}
                        Find my next question
                      </button>
                      <div className="controls-note">
                        <ShieldCheck size={17} />
                        <p>
                          Each item is authored and reviewed, or generated with
                          an independent check. Previously submitted items are
                          excluded.
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
                          <form onSubmit={submitAnswer}>
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
                                    onChange={(e) =>
                                      setResponse(e.target.value)
                                    }
                                    disabled={!!feedback || practiceBusy}
                                    placeholder="Explain it in your own words…"
                                    maxLength={2000}
                                  />
                                ) : (
                                  <input
                                    aria-label="Your numerical answer"
                                    inputMode="decimal"
                                    value={response}
                                    onChange={(e) =>
                                      setResponse(e.target.value)
                                    }
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
                                )}{" "}
                                Check my answer
                              </button>
                            )}
                          </form>
                          {feedback && (
                            <div
                              className={`feedback-card ${feedback.correct === false ? "repair" : feedback.correct == null ? "unscored" : "correct"}`}
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
                                Reference answer:{" "}
                                <strong>{feedback.answer}</strong>
                              </div>
                              {feedback.hypothesis && (
                                <p className="hypothesis">
                                  {feedback.hypothesis}
                                </p>
                              )}
                              {citations(feedback.citations)}
                              <div className="estimate-update">
                                {feedback.correct == null
                                  ? "Mastery estimate unchanged"
                                  : `Provisional estimate: ${Math.round((feedback.prior ?? feedback.estimate) * 100)}% → ${Math.round(feedback.estimate * 100)}%`}
                              </div>
                              <button
                                className="button primary"
                                onClick={nextPractice}
                                disabled={practiceBusy}
                              >
                                {diagnosticStep === diagnosticTopics.length - 1
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
                            {!feedback && citations(question.citations)}
                          </div>
                        </>
                      ) : (
                        <Empty
                          title={
                            selectionReason ||
                            "One focused question. A clearer next step."
                          }
                          text="Choose your topic and format, then find an unseen question. Or start with a three-question diagnostic."
                          action={
                            <button
                              className="button secondary"
                              onClick={startDiagnostic}
                            >
                              Start diagnostic <ArrowRight size={16} />
                            </button>
                          }
                        />
                      )}
                    </section>
                  </div>
                </>
              )}

              {tab === "exam" && (
                <ExamView
                  api={api}
                  course={course}
                  topics={progress.topics}
                  onCitation={openCitation}
                  onProgress={refresh}
                />
              )}
              {tab === "progress" && (
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
                                  ? ` · Needs ${t.prerequisites.map((p) => progress.topics.find((x) => x.id === p)?.name).join(", ")}`
                                  : ""}
                              </span>
                              <button
                                className="text-button"
                                onClick={() => {
                                  setTab("practice");
                                  setTopic(t.id);
                                  void getQuestion(t.id);
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
                                setTab("practice");
                                setTopic(weakest?.id || "pointers");
                                void getQuestion(weakest?.id || "pointers");
                              }
                            : startDiagnostic
                        }
                      >
                        Take the next step <ArrowRight size={16} />
                      </button>
                    </section>
                  </div>
                  <ConceptMap
                    topics={progress.topics}
                    onPractice={(id) => {
                      setTab("practice");
                      setTopic(id);
                      void getQuestion(id);
                    }}
                  />
                  <RevisionCards items={revision} onCitation={openCitation} />
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
                      <Empty
                        title="Your first check is the first piece of evidence."
                        text="Practice responses will appear here with their outcomes."
                      />
                    )}
                  </section>
                </>
              )}

              {tab === "evaluation" && (
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
                        {evaluation?.status === "not-run"
                          ? "The benchmark hasn’t run yet."
                          : "Course evaluation report"}
                      </h2>
                      <p>
                        {String(
                          evaluation?.message ||
                            "Loading the evaluation report…",
                        )}
                      </p>
                    </div>
                    <span className="status-badge">
                      {evaluation?.status === "not-run"
                        ? "NOT MEASURED"
                        : "REPORT AVAILABLE"}
                    </span>
                  </div>
                  <Readiness api={api} course={course} />
                  <div className="metric-grid">
                    {[
                      "Faithfulness",
                      "Response relevancy",
                      "Context precision",
                      "Context recall",
                    ].map((name) => (
                      <div className="panel metric-card" key={name}>
                        <span className="tiny-label">{name}</span>
                        <strong>
                          {evaluation?.metrics &&
                          typeof evaluation.metrics === "object"
                            ? String(
                                (evaluation.metrics as Record<string, unknown>)[
                                  name.toLowerCase().replaceAll(" ", "_")
                                ] ?? "—",
                              )
                            : "—"}
                        </strong>
                        <small>
                          {evaluation?.status === "not-run"
                            ? "Requires a real Ragas run"
                            : "From the saved benchmark"}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="overview-grid">
                    <section className="panel">
                      <SectionHeader title="What we plan to measure" />
                      <ul className="evaluation-list">
                        <li>
                          <ShieldCheck size={17} />
                          Support for each claim and the accuracy of its
                          citation
                        </li>
                        <li>
                          <BookOpen size={17} />
                          Retrieval quality across text, figures and lectures
                        </li>
                        <li>
                          <CircleHelp size={17} />
                          Correct refusals without excessive false refusals
                        </li>
                        <li>
                          <Network size={17} />
                          Personalization against a fixed-order baseline
                        </li>
                        <li>
                          <CheckCircle2 size={17} />
                          Verified questions and repetition across sessions
                        </li>
                      </ul>
                    </section>
                    <section className="panel">
                      <SectionHeader title="Reproducible, by design" />
                      <p>
                        The repository contains an evaluation runner, a gold-set
                        template and a seeded learner simulator. Framework
                        scores and simulated outcomes are reported separately.
                      </p>
                      <div className="code-note">
                        python -m learnproof.evaluate
                        <br />
                        python -m learnproof.simulate
                      </div>
                      <p className="muted">
                        Targets are not results. Simulated behavior is not
                        evidence of real student learning.
                      </p>
                    </section>
                  </div>
                </>
              )}
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
                      setViewer(viewUnits.find((u) => u.id === e.target.value)!)
                    }
                  >
                    {viewUnits.map((u) => (
                      <option value={u.id} key={u.id}>
                        {u.location}
                      </option>
                    ))}
                  </select>
                )}
                {["mp4", "webm"].includes(viewer.kind) ? (
                  <video
                    ref={videoRef}
                    controls
                    src={viewer.original_url}
                    onLoadedMetadata={(e) => {
                      if (viewer.start != null)
                        e.currentTarget.currentTime = viewer.start;
                    }}
                  />
                ) : viewer.image_url ? (
                  <img
                    src={viewer.image_url}
                    alt={`${viewer.source_name}, ${viewer.location}`}
                  />
                ) : (
                  <Empty
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
                {viewer.kind === "pptx" &&
                  !viewer.extraction?.includes("rendered-slide") && (
                    <div className="info-note small">
                      This is an approximate structural preview. Open the
                      original slide deck for full fidelity.
                    </div>
                  )}
                <a
                  className="button secondary"
                  href={
                    viewer.original_url +
                    (viewer.kind === "pdf" ? `#page=${viewer.page}` : "")
                  }
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
              modal === "help" ? "How LearnProof works" : `Add ${modal}`
            }
          >
            <div className="modal-header">
              <h2>
                {modal === "help"
                  ? "Understanding, with evidence."
                  : modal === "workspace"
                    ? "Choose your learning space"
                    : modal === "course"
                      ? "A new course space"
                      : "A fresh learning profile"}
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            {modal === "help" ? (
              <div className="help-content">
                <p>
                  Add course material, ask a source-bound question, and practice
                  with cited feedback. Only scored responses change your
                  provisional mastery estimate.
                </p>
                <h3>
                  {health?.provider_configured
                    ? "AI is connected"
                    : "Connect AI on the server"}
                </h3>
                <p>
                  {health?.provider_configured
                    ? `Configured model: ${health.model}. Live provider behavior still needs a successful real request.`
                    : "Local mode selects exact document excerpts and uses authored practice. To enable visual interpretation, video ingestion and generated explanations, configure the server."}
                </p>
                {!health?.provider_configured && (
                  <>
                    <div className="code-note">
                      Copy .env.example to .env
                      <br />
                      Set GEMINI_API_KEY in .env
                      <br />
                      Restart the Python API
                    </div>
                    <p className="muted">
                      Keep the key in the server environment. Do not paste it
                      into this page or commit it to GitHub. Uploading in AI
                      mode sends course content to Gemini.
                    </p>
                  </>
                )}
                <p className="muted">
                  This is a local prototype with separate learning profiles, not
                  an authenticated multi-user service. Sample sources are
                  original authored material. No benchmark scores are prefilled.
                </p>
              </div>
            ) : modal === "workspace" ? (
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
                      localStorage.setItem(
                        "learnproof-learner",
                        e.target.value,
                      );
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
                      setModal("course");
                      setNewName("");
                    }}
                  >
                    <Plus size={16} />
                    Add course
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setModal("learner");
                      setNewName("");
                    }}
                  >
                    <Plus size={16} />
                    Add profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={addNamed} className="name-form">
                <label>
                  {modal === "course" ? "Course name" : "Profile name"}
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    minLength={2}
                    maxLength={80}
                    placeholder={
                      modal === "course"
                        ? "e.g. Algorithms, Unit 1"
                        : "e.g. Practice profile"
                    }
                    required
                  />
                </label>
                <p className="muted">
                  {modal === "course"
                    ? "Start with an empty library and add your own materials. Topics are suggested from your indexed course material; inferred prerequisites are labeled as suggestions."
                    : "A separate local response history and mastery estimate. This does not create an account."}
                </p>
                <button
                  className="button primary"
                  disabled={saving || newName.trim().length < 2}
                >
                  {saving && <Loader2 className="spin" size={16} />}Create{" "}
                  {modal}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
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
function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
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
function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
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
function Status({ source }: { source: Source }) {
  return (
    <span className={`status-badge ${source.status}`}>
      <span />
      {source.status === "indexed" ? "READY" : source.status.toUpperCase()}
    </span>
  );
}
function SourceCard({
  source,
  onOpen,
  icon,
}: {
  source: Source;
  onOpen: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      className="source-card"
      onClick={onOpen}
      disabled={["queued", "extracting"].includes(source.status)}
    >
      <div className="source-card-top">
        <span className={`file-icon ${source.kind}`}>{icon}</span>
        <ArrowUpRight size={17} />
      </div>
      <strong>{source.name}</strong>
      <small>
        {source.kind.toUpperCase()} · {source.unit_count} units
      </small>
      <Status source={source} />
    </button>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="next-icon">
        <BookOpen size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
