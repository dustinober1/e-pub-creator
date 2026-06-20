import { useEffect, useRef, useState } from "react";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import type { BookProject, BookSection } from "@epub-creator/core/book";
import { saveProject } from "./api/client";
import type { UploadImportReport } from "./api/client";
import {
  createPreviewDocument,
  renderSectionFragment,
} from "@epub-creator/renderer";
import { BookOutline } from "./components/BookOutline";
import { EditablePreview } from "./components/EditablePreview";
import {
  ImportActions,
  type ImportCompletion,
} from "./components/ImportActions";
import { ImportReview } from "./components/ImportReview";
import { FindReplacePanel } from "./components/FindReplacePanel";
import {
  MetadataPanel,
  type EditableMetadata,
} from "./components/MetadataPanel";
import { ProjectActions } from "./components/ProjectActions";
import { ShortcutsDialog } from "./components/ShortcutsDialog";
import { SectionEditor } from "./components/SectionEditor";
import { ThemeEditor } from "./components/ThemeEditor";
import { ThemeGallery } from "./components/ThemeGallery";
import { ValidationPanel } from "./components/ValidationPanel";
import { VersionHistoryPanel } from "./components/VersionHistoryPanel";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "./lib/project-history";

type SaveState =
  | { kind: "idle"; label: string }
  | { kind: "dirty"; label: string }
  | { kind: "saving"; label: string }
  | { kind: "saved"; label: string }
  | { kind: "error"; label: string };

type PreviewMode = "edit" | "epub" | "reader";

const EPUB_PREVIEW_CSS =
  "body { font-family: serif; line-height: 1.55; margin: 2rem; }";
const READER_PREVIEW_CSS =
  "body { font-family: Georgia, serif; font-size: 18px; line-height: 1.7; margin: 0 auto; max-width: 680px; padding: 2rem; }";

const sampleProject = (() => {
  const project = createBookProject({
    title: "Formatting Stress Book",
    author: "Sample Author",
    language: "en",
  });

  const chapter = createSection({
    title: "Chapter One",
    role: "body",
    blocks: [
      createTextBlock(
        "paragraph",
        "The first paragraph tests ordinary prose flow and margins in the preview pane.",
      ),
      createTextBlock("scene-break", ""),
      createTextBlock(
        "epigraph",
        "A sample epigraph checks quote treatment before export.",
      ),
    ],
  });

  return {
    ...project,
    sections: [chapter],
  };
})();

export function App() {
  const [projectHistory, setProjectHistory] = useState(() =>
    createHistory(sampleProject),
  );
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const saveVersionRef = useRef(0);
  const saveRequestIdRef = useRef(0);
  const activeProject = projectHistory.present;
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    label: "Not saved",
  });
  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >(sampleProject.sections[0]?.id);
  const [projectFolderPath, setProjectFolderPath] = useState("");
  const [importReport, setImportReport] = useState<UploadImportReport>();
  const selectedSection = activeProject.sections.find(
    (section) => section.id === selectedSectionId,
  );
  const previewSection = selectedSection ?? activeProject.sections[0];

  function markProjectDirty(): void {
    saveVersionRef.current += 1;
    setSaveState({
      kind: "dirty",
      label: "Unsaved changes",
    });
  }

  function loadProject(project: BookProject): void {
    saveVersionRef.current += 1;
    saveRequestIdRef.current += 1;
    setProjectHistory(createHistory(project));
    setSaveState({
      kind: "idle",
      label: "Not saved",
    });
  }

  function updateProject(recipe: (project: BookProject) => BookProject): void {
    setProjectHistory((current) => {
      const nextProject = recipe(current.present);

      if (pushHistory(current, nextProject) === current) {
        return current;
      }

      return pushHistory(current, {
        ...nextProject,
        updatedAt: new Date().toISOString(),
      });
    });

    markProjectDirty();
  }

  function replaceProject(project: BookProject): void {
    updateProject(() => project);
  }

  function undoProjectChange(): boolean {
    if (projectHistory.past.length === 0) {
      return false;
    }

    setProjectHistory(undoHistory);
    markProjectDirty();
    return true;
  }

  function redoProjectChange(): boolean {
    if (projectHistory.future.length === 0) {
      return false;
    }

    setProjectHistory(redoHistory);
    markProjectDirty();
    return true;
  }

  function focusFindField(): void {
    const findInput = document.querySelector<HTMLInputElement>(
      'section[aria-labelledby="find-replace-heading"] input',
    );

    findInput?.focus();
    findInput?.select();
  }

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable
    );
  }

  function handleMetadataChange(metadata: EditableMetadata): void {
    updateProject((project) => ({
      ...project,
      metadata: {
        ...project.metadata,
        ...metadata,
      },
    }));
  }

  function handleSectionChange(section: BookSection): void {
    updateProject((project) => ({
      ...project,
      sections: project.sections.map((candidate) =>
        candidate.id === section.id ? section : candidate,
      ),
    }));
  }

  function moveSection(sectionId: string, direction: -1 | 1): void {
    updateProject((project) => {
      const fromIndex = project.sections.findIndex(
        (section) => section.id === sectionId,
      );
      const toIndex = fromIndex + direction;

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        toIndex >= project.sections.length
      ) {
        return project;
      }

      const sections = [...project.sections];
      const [section] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, section);

      return {
        ...project,
        sections,
      };
    });
  }

  function handleImported(result: ImportCompletion): void {
    if (result.kind === "docx") {
      loadProject(result.response.bookProject);
      setProjectFolderPath(result.response.project ?? "");
      setSelectedSectionId(result.response.bookProject.sections[0]?.id);
      setImportReport(result.response.report);
      return;
    }

    const importedProject =
      result.response.bookProject ??
      createBookProject({
        title: result.response.title ?? result.response.project,
        author: "",
        language: "und",
      });
    loadProject(importedProject);
    setProjectFolderPath(result.response.project);
    setSelectedSectionId(importedProject.sections[0]?.id);
    setImportReport(undefined);
  }

  function handleSnapshotRestored(project: BookProject): void {
    loadProject(project);
    setSelectedSectionId(project.sections[0]?.id);
    setSaveState({
      kind: "saved",
      label: "Version restored",
    });
  }

  async function saveCurrentProject(): Promise<void> {
    const trimmedProjectPath = projectFolderPath.trim();

    if (!trimmedProjectPath) {
      setSaveState({
        kind: "error",
        label: "Project folder is required.",
      });
      return;
    }

    const requestVersion = saveVersionRef.current;
    const requestId = ++saveRequestIdRef.current;

    setSaveState({
      kind: "saving",
      label: "Saving...",
    });

    try {
      const result = await saveProject(trimmedProjectPath, activeProject);
      if (
        requestId !== saveRequestIdRef.current ||
        requestVersion !== saveVersionRef.current
      ) {
        return;
      }

      setSaveState({
        kind: "saved",
        label: `Saved ${new Date().toLocaleTimeString()}`,
      });
      setProjectFolderPath(result.project);
    } catch (error) {
      if (
        requestId !== saveRequestIdRef.current ||
        requestVersion !== saveVersionRef.current
      ) {
        return;
      }

      setSaveState({
        kind: "error",
        label: error instanceof Error ? error.message : String(error),
      });
    }
  }

  useEffect(() => {
    function handleKeyboardShortcuts(event: KeyboardEvent): void {
      const modifierPressed = event.metaKey || event.ctrlKey;
      const isUndoRedoShortcut =
        event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y";

      if (!modifierPressed) {
        return;
      }

      if (isEditableTarget(event.target) && isUndoRedoShortcut) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCurrentProject();
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        focusFindField();
        return;
      }

      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redoProjectChange();
        return;
      }

      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoProjectChange();
        return;
      }

      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoProjectChange();
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcuts);

    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [focusFindField, redoProjectChange, saveCurrentProject, undoProjectChange]);

  // ponytail: debounce only; add conflict detection if multi-window editing matters.
  useEffect(() => {
    if (saveState.kind !== "dirty" || !projectFolderPath.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveCurrentProject();
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [activeProject, projectFolderPath, saveState.kind]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{activeProject.metadata.title}</h1>
          <p>
            {activeProject.metadata.author} / {activeProject.metadata.language}
          </p>
        </div>
        <div className="topbar-meta">
          <div className="topbar-actions" aria-label="Document actions">
            <button
              type="button"
              onClick={undoProjectChange}
              disabled={projectHistory.past.length === 0}
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redoProjectChange}
              disabled={projectHistory.future.length === 0}
            >
              Redo
            </button>
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
            >
              Shortcuts
            </button>
          </div>
          <span className={`save-status save-status-${saveState.kind}`}>
            {saveState.label}
          </span>
        </div>
      </header>
      <section className="workspace-grid" aria-label="Workspace">
        <BookOutline
          sections={activeProject.sections}
          selectedSectionId={previewSection?.id}
          onMoveSection={moveSection}
          onSelectSection={setSelectedSectionId}
        />
        <section className="preview-panel" aria-labelledby="preview-heading">
          <div className="preview-header">
            <div>
              <h2 id="preview-heading">Preview</h2>
              <span>{previewSection?.title}</span>
            </div>
            <div className="segmented-control" aria-label="Preview mode">
              {(["edit", "epub", "reader"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={previewMode === mode}
                  className={previewMode === mode ? "is-active" : undefined}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode === "edit"
                    ? "Edit"
                    : mode === "epub"
                      ? "EPUB Preview"
                      : "Reader Preview"}
                </button>
              ))}
            </div>
          </div>
          {previewSection && previewMode === "edit" ? (
            <EditablePreview
              project={activeProject}
              section={previewSection}
              onSectionChange={handleSectionChange}
            />
          ) : null}
          {previewSection && previewMode !== "edit" ? (
            <iframe
              className="preview-frame"
              title={previewMode === "epub" ? "EPUB preview" : "Reader preview"}
              sandbox=""
              srcDoc={createPreviewDocument(
                activeProject,
                renderSectionFragment(activeProject, previewSection),
                previewMode === "epub" ? EPUB_PREVIEW_CSS : READER_PREVIEW_CSS,
              )}
            />
          ) : null}
        </section>
        <aside className="stack" aria-label="Project controls">
          <ImportActions onImported={handleImported} />
          <ProjectActions
            bookProject={activeProject}
            projectPath={projectFolderPath}
            onProjectPathChange={setProjectFolderPath}
            onSaveProject={saveCurrentProject}
          />
          <VersionHistoryPanel
            projectPath={projectFolderPath}
            onRestore={handleSnapshotRestored}
          />
          <MetadataPanel
            metadata={activeProject.metadata}
            onChange={handleMetadataChange}
          />
          <FindReplacePanel
            project={activeProject}
            onProjectChange={replaceProject}
          />
          {selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onChange={handleSectionChange}
            />
          ) : (
            <section
              className="panel section-editor"
              aria-labelledby="section-editor-heading"
            >
              <h2 id="section-editor-heading">Section Editor</h2>
              <p className="panel-copy">
                Select a section to edit its title, role, and text blocks.
              </p>
            </section>
          )}
          <ImportReview
            bookProject={activeProject}
            report={importReport ?? undefined}
            projectPath={projectFolderPath}
          />
          <ThemeGallery />
          <ThemeEditor />
          <ValidationPanel />
        </aside>
      </section>
      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </main>
  );
}
