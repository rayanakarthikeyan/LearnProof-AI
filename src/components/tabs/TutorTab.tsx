import { type FormEvent, type RefObject } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Chat, Citation, Health, Source } from "../../types";
import { CitationList, PageHeading, sourceIcon } from "../Common";

interface TutorTabProps {
  health: Health | null;
  courseName: string;
  indexed: Source[];
  chats: Chat[];
  query: string;
  setQuery: (q: string) => void;
  chatBusy: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onCheckConversation: (id: string) => void;
  practiceBusy: boolean;
  onSendChat: (e?: FormEvent, preset?: string) => void;
  onOpenSource: (s: Source) => void;
  onOpenCitation: (c: Citation) => void;
}

export function TutorTab({
  health,
  courseName,
  indexed,
  chats,
  query,
  setQuery,
  chatBusy,
  chatEndRef,
  onSendChat,
  onCheckConversation,
  practiceBusy,
  onOpenSource,
  onOpenCitation,
}: TutorTabProps) {
  const suggestedPrompts = [
    "Is every linked-list insertion O(1)?",
    "How does linked-list traversal work?",
    "What rule does a stack follow?",
  ];

  return (
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
                  Pick a concept, ask why a step works, or find the evidence
                  behind an answer.
                </p>
                <div className="suggested-questions">
                  {suggestedPrompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => onSendChat(undefined, q)}
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
                    <CitationList
                      items={chat.response.citations}
                      onOpen={onOpenCitation}
                    />
                    {chat.response.status === "supported" && (
                      <button
                        className="text-button"
                        disabled={practiceBusy}
                        onClick={() => onCheckConversation(chat.id)}
                      >
                        Check this understanding <ArrowRight size={14} />
                      </button>
                    )}
                    <div className="response-note">{chat.response.message}</div>
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
            <div ref={chatEndRef} />
          </div>

          <form className="chat-form" onSubmit={(e) => onSendChat(e)}>
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
            Outside the material? We’ll say so. Asking a question alone does not
            change mastery.
          </div>
        </section>

        <aside className="tutor-aside">
          <div className="panel">
            <span className="eyebrow">YOUR CONTEXT</span>
            <h3>{courseName}</h3>
            <p>
              {indexed.length} indexed sources. Answers stay within this course.
            </p>
            <div className="context-sources">
              {indexed.map((s) => (
                <button key={s.id} onClick={() => onOpenSource(s)}>
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
  );
}
