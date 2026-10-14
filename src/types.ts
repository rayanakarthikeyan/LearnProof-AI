export type Named = { id: string; name: string };
export type Topic = Named & {
  description: string;
  prerequisites: string[];
  estimate: number;
  observations: number;
};
export type Source = Named & {
  kind: string;
  status: string;
  error: string | null;
  warnings: string[];
  unit_count: number;
};
export type Citation = {
  id: string;
  source_id: string;
  source_name: string;
  kind: string;
  location: string;
  page: number | null;
  start: number | null;
  end: number | null;
  excerpt: string;
  image_url: string | null;
  original_url: string;
  visual?: string;
  extraction?: string;
};
export type TutorResponse = {
  status: string;
  mode: string;
  message: string;
  claims: { text: string; source_ids: string[] }[];
  citations: Citation[];
};
export type Chat = { id: string; question: string; response: TutorResponse };
export type Question = {
  id: string;
  prompt: string;
  concept: string;
  kind: string;
  options: string[];
  difficulty: number;
  verification: string;
  citations: Citation[];
  origin: string;
};
export type Feedback = {
  correct: boolean | null;
  answer: string;
  feedback: string;
  prior: number | null;
  estimate: number;
  concept: string;
  citations: Citation[];
  hypothesis: string | null;
};
export type Attempt = {
  id: string;
  correct: number | null;
  feedback: string;
  created_at: string;
  concept: string;
  prompt: string;
  kind: string;
};
export type Progress = {
  topics: Topic[];
  attempts: Attempt[];
  total_attempts: number;
  scored_attempts: number;
  correct_attempts: number;
  observed_topics: number;
  estimate_note: string;
};
export type Health = {
  provider_configured: boolean;
  mode: string;
  model: string | null;
  version: string;
};
export type Repair = {
  stage: string;
  target: string;
  probe: string;
  question: Question | null;
  feedback: Feedback | null;
  message?: string;
};
export type Exam = {
  id: string;
  questions: Question[];
  submitted_ids: string[];
  completed: boolean;
  scored: number;
  correct: number;
  unscored: number;
  weak_topics: string[];
  feedback: {
    question_id: string;
    feedback: string;
    correct: number | null;
    citations: Citation[];
  }[];
};
export type ApiClient = <T>(path: string, options?: RequestInit) => Promise<T>;

export type Tab =
  | "overview"
  | "library"
  | "tutor"
  | "practice"
  | "exam"
  | "progress"
  | "evaluation";
