import { useState } from "react";
import { importProject } from "../api/client";

export function ImportActions() {
  const [source, setSource] = useState("");
  const [project, setProject] = useState("");
  const [status, setStatus] = useState("");

  async function submitImport(): Promise<void> {
    setStatus("Importing...");

    try {
      const result = await importProject(source, project);
      setStatus(`${result.title ?? result.project} imported.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
    }
  }

  return (
    <section className="panel" aria-label="Import actions">
      <h2>Import</h2>
      <div className="import-fields">
        <label>
          Source path
          <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="/path/to/book.md" />
        </label>
        <label>
          Project folder
          <input
            value={project}
            onChange={(event) => setProject(event.target.value)}
            placeholder="/path/to/Book.epubproj"
          />
        </label>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => void submitImport()}>
          Import DOCX
        </button>
        <button type="button" onClick={() => void submitImport()}>
          Import Markdown
        </button>
      </div>
      {status ? <p className="import-status">{status}</p> : null}
    </section>
  );
}
