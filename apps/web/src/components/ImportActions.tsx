import { useState } from "react";
import { importProject, uploadDocxProject, type ImportProjectResponse, type UploadDocxProjectResponse } from "../api/client";

export type ImportCompletion =
  | { kind: "markdown"; response: ImportProjectResponse }
  | { kind: "docx"; response: UploadDocxProjectResponse };

interface ImportActionsProps {
  onImported?: (result: ImportCompletion) => void;
}

export function ImportActions({ onImported }: ImportActionsProps) {
  const [source, setSource] = useState("");
  const [project, setProject] = useState("");
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function submitMarkdownImport(): Promise<void> {
    setStatus("Importing...");

    try {
      const result = await importProject(source, project);
      setStatus(`${result.title ?? result.project} imported.`);
      onImported?.({ kind: "markdown", response: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
    }
  }

  async function submitDocxImport(): Promise<void> {
    if (!docxFile) {
      setStatus("Select a DOCX file to import.");
      return;
    }

    setStatus("Importing...");

    try {
      const result = await uploadDocxProject({
        file: docxFile,
        project: project || undefined
      });
      setStatus(`${result.title ?? result.project ?? docxFile.name} imported.`);
      onImported?.({ kind: "docx", response: result });
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
          DOCX file
          <input
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setDocxFile(event.target.files?.[0] ?? null)}
          />
        </label>
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
        <button type="button" onClick={() => void submitDocxImport()}>
          Import DOCX
        </button>
        <button type="button" onClick={() => void submitMarkdownImport()}>
          Import Markdown
        </button>
      </div>
      {status ? <p className="import-status">{status}</p> : null}
    </section>
  );
}
