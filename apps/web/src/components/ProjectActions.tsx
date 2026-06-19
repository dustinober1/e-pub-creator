import { useState } from "react";
import type { BookProject } from "@epub-creator/core/book";
import { exportProject, saveProject } from "../api/client";

type ExportProfile = "portable-epub3" | "kdp-safe" | "apple-books-enhanced";

interface ProjectActionsProps {
  bookProject: BookProject;
  projectPath: string;
  onProjectPathChange: (projectPath: string) => void;
}

export function ProjectActions({
  bookProject,
  projectPath,
  onProjectPathChange
}: ProjectActionsProps) {
  const [outputPath, setOutputPath] = useState("");
  const [profile, setProfile] = useState<ExportProfile>("portable-epub3");
  const [status, setStatus] = useState("");

  async function submitSave(): Promise<void> {
    const trimmedProjectPath = projectPath.trim();

    if (!trimmedProjectPath) {
      setStatus("Project folder is required.");
      return;
    }

    setStatus("Saving...");

    try {
      const result = await saveProject(trimmedProjectPath, bookProject);
      setStatus(`Saved ${result.project}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
    }
  }

  async function submitExport(): Promise<void> {
    const trimmedProjectPath = projectPath.trim();
    const trimmedOutputPath = outputPath.trim();

    if (!trimmedProjectPath) {
      setStatus("Project folder is required.");
      return;
    }

    if (!trimmedOutputPath) {
      setStatus("EPUB output path is required.");
      return;
    }

    setStatus("Exporting...");

    try {
      const result = await exportProject({
        project: trimmedProjectPath,
        output: trimmedOutputPath,
        profile,
        bookProject
      });
      setStatus(`Exported ${result.outputPath} with ${result.issueCount} issues.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
    }
  }

  return (
    <section className="panel" aria-labelledby="project-actions-heading">
      <h2 id="project-actions-heading">Project Actions</h2>
      <div className="metadata-list">
        <label className="editor-field">
          <span>Project folder</span>
          <input
            type="text"
            value={projectPath}
            onChange={(event) => onProjectPathChange(event.target.value)}
            placeholder="/path/to/Book.epubproj"
          />
        </label>
        <label className="editor-field">
          <span>EPUB output path</span>
          <input
            type="text"
            value={outputPath}
            onChange={(event) => setOutputPath(event.target.value)}
            placeholder="/path/to/Book.epub"
          />
        </label>
        <label className="editor-field">
          <span>Export profile</span>
          <select value={profile} onChange={(event) => setProfile(event.target.value as ExportProfile)}>
            <option value="portable-epub3">portable-epub3</option>
            <option value="kdp-safe">kdp-safe</option>
            <option value="apple-books-enhanced">apple-books-enhanced</option>
          </select>
        </label>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => void submitSave()}>
          Save Project
        </button>
        <button type="button" onClick={() => void submitExport()}>
          Export EPUB
        </button>
      </div>
      {status ? <p className="import-status">{status}</p> : null}
    </section>
  );
}
