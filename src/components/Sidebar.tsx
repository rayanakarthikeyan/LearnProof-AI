import {
  GraduationCap,
  Leaf,
  Network,
  Plus,
  LayoutDashboard,
  FolderOpen,
  MessageSquareText,
  Target,
  TrendingUp,
  FlaskConical,
} from "lucide-react";
import type { Named, Source, Tab } from "../types";

export const NAV_ITEMS = [
  ["overview", "Overview", LayoutDashboard],
  ["library", "Course library", FolderOpen],
  ["tutor", "Evidence tutor", MessageSquareText],
  ["practice", "Practice & repair", Target],
  ["exam", "Mock exams", GraduationCap],
  ["progress", "My understanding", TrendingUp],
  ["evaluation", "Evaluation", FlaskConical],
] as const;

interface SidebarProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  courses: Named[];
  course: string;
  setCourse: (id: string) => void;
  learners: Named[];
  learner: string;
  setLearner: (id: string) => void;
  sources: Source[];
  onOpenModal: (modal: "course" | "learner") => void;
}

export function Sidebar({
  tab,
  setTab,
  courses,
  course,
  setCourse,
  learners,
  learner,
  setLearner,
  sources,
  onOpenModal,
}: SidebarProps) {
  const currentCourse = courses.find((c) => c.id === course);
  const courseName = currentCourse?.name || "Data Structures Foundations";
  const indexed = sources.filter((s) => s.status === "indexed");
  const currentLearner = learners.find((l) => l.id === learner);

  return (
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
        {NAV_ITEMS.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id as Tab)}
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
        <button className="text-button" onClick={() => onOpenModal("course")}>
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
            {(currentLearner?.name || "My").slice(0, 1)}
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
            onClick={() => onOpenModal("learner")}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
