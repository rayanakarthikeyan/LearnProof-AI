import {
  ArrowUpRight,
  CircleHelp,
  Loader2,
  Plus,
  Search,
  UploadCloud,
} from "lucide-react";
import type { Health, Source } from "../../types";
import { EmptyState, PageHeading, StatusBadge, sourceIcon } from "../Common";

interface LibraryTabProps {
  sources: Source[];
  filteredSources: Source[];
  search: string;
  setSearch: (s: string) => void;
  health: Health | null;
  uploading: boolean;
  onUploadFiles: (files: FileList | File[]) => void;
  onOpenSource: (s: Source) => void;
  onRetrySource: (s: Source) => void;
  onOpenHelpModal: () => void;
  onTriggerUpload: () => void;
}

export function LibraryTab({
  sources,
  filteredSources,
  search,
  setSearch,
  health,
  uploading,
  onUploadFiles,
  onOpenSource,
  onRetrySource,
  onOpenHelpModal,
  onTriggerUpload,
}: LibraryTabProps) {
  return (
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
          if (e.dataTransfer.files?.length) {
            onUploadFiles(e.dataTransfer.files);
          }
        }}
      >
        <span className="upload-icon">
          <UploadCloud size={27} />
        </span>
        <div>
          <h3>
            {uploading ? "Adding your material…" : "Drop your next source here"}
          </h3>
          <p>
            PDF · PPTX · MP4 · WebM{" "}
            <span>Documents up to 25 MB · Videos up to 100 MB / 10 min</span>
          </p>
        </div>
        <button
          className="button primary"
          onClick={onTriggerUpload}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="spin" size={16} />
          ) : (
            <Plus size={16} />
          )}
          Choose files
        </button>
      </div>

      {!health?.provider_configured && (
        <div className="info-note">
          <CircleHelp size={17} />
          <span>
            PDF and slide text can be indexed locally. Diagram interpretation
            and lecture-video understanding need the AI connection.
          </span>
          <button className="text-button" onClick={onOpenHelpModal}>
            Set up AI <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      <div className="section-header library-tools">
        <h2>
          Course material <span className="count-pill">{sources.length}</span>
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
            <span className={`file-icon ${s.kind}`}>{sourceIcon(s.kind)}</span>
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
            <StatusBadge source={s} />
            <button
              className="button secondary compact"
              onClick={() =>
                s.status === "failed" ? onRetrySource(s) : onOpenSource(s)
              }
              disabled={["queued", "extracting"].includes(s.status)}
            >
              {s.status === "failed" ? "Retry" : "Open source"}
              <ArrowUpRight size={14} />
            </button>
          </div>
        ))}

        {!filteredSources.length && (
          <EmptyState
            title={
              sources.length ? "No matching sources" : "Your course starts here"
            }
            text="Add a PDF, slide deck or lecture to create a searchable course library."
          />
        )}
      </div>
    </>
  );
}
