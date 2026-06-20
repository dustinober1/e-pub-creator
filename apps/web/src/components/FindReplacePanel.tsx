import { useMemo, useState } from "react";
import type { BookProject } from "@epub-creator/core/book";
import { findMatches, replaceAllMatches } from "../lib/find-replace";

interface FindReplacePanelProps {
  project: BookProject;
  onProjectChange: (project: BookProject) => void;
}

export function FindReplacePanel({
  project,
  onProjectChange,
}: FindReplacePanelProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const matches = useMemo(() => findMatches(project, query), [project, query]);

  return (
    <section className="panel find-replace-panel" aria-labelledby="find-replace-heading">
      <h2 id="find-replace-heading">Find and Replace</h2>
      <div className="metadata-list">
        <label className="editor-field">
          <span>Find</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="editor-field">
          <span>Replace</span>
          <input
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
          />
        </label>
      </div>
      <div className="button-row">
        <button
          type="button"
          disabled={!query.trim() || matches.length === 0}
          onClick={() =>
            onProjectChange(replaceAllMatches(project, query, replacement))
          }
        >
          Replace All
        </button>
      </div>
      <p className="panel-copy">
        {matches.length} {matches.length === 1 ? "match" : "matches"}
      </p>
      {matches.length > 0 ? (
        <ol className="find-results" aria-label="Find results">
          {matches.slice(0, 8).map((match, index) => (
            <li key={`${match.sectionId}-${match.blockId ?? "title"}-${index}`}>
              {match.text}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
