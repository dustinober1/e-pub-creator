import { useState } from "react";
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core/book";
import { renderSectionFragment } from "@epub-creator/renderer/html";
import { createPreviewDocument } from "@epub-creator/renderer/preview";
import type { UploadImportReport } from "./api/client";
import { BookOutline } from "./components/BookOutline";
import { ImportActions, type ImportCompletion } from "./components/ImportActions";
import { ImportReview } from "./components/ImportReview";
import { MetadataPanel } from "./components/MetadataPanel";
import { PreviewFrame } from "./components/PreviewFrame";
import { ThemeEditor } from "./components/ThemeEditor";
import { ThemeGallery } from "./components/ThemeGallery";
import { ValidationPanel } from "./components/ValidationPanel";

const sampleProject = (() => {
  const project = createBookProject({
    title: "Formatting Stress Book",
    author: "Sample Author",
    language: "en"
  });

  const chapter = createSection({
    title: "Chapter One",
    role: "body",
    blocks: [
      createTextBlock("paragraph", "The first paragraph tests ordinary prose flow and margins in the preview pane."),
      createTextBlock("scene-break", ""),
      createTextBlock("epigraph", "A sample epigraph checks quote treatment before export.")
    ]
  });

  return {
    ...project,
    sections: [chapter]
  };
})();

export function App() {
  const [activeProject, setActiveProject] = useState(sampleProject);
  const [selectedSectionId, setSelectedSectionId] = useState(sampleProject.sections[0]?.id);
  const [importedProjectPath, setImportedProjectPath] = useState<string>();
  const [importReport, setImportReport] = useState<UploadImportReport>();
  const previewSection = activeProject.sections.find((section) => section.id === selectedSectionId) ?? activeProject.sections[0];
  const renderedSections = previewSection ? renderSectionFragment(activeProject, previewSection) : "";
  const previewHtml = createPreviewDocument(
    activeProject,
    renderedSections,
    "body { font-family: Georgia, serif; line-height: 1.55; padding: 2rem; }"
  );

  function handleImported(result: ImportCompletion): void {
    if (result.kind === "docx") {
      setActiveProject(result.response.bookProject);
      setImportedProjectPath(result.response.project);
      setSelectedSectionId(result.response.bookProject.sections[0]?.id);
      setImportReport(result.response.report);
      return;
    }

    setImportedProjectPath(result.response.project);
    setImportReport(undefined);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{activeProject.metadata.title}</h1>
          <p>
            {activeProject.metadata.author} / {activeProject.metadata.language}
          </p>
        </div>
      </header>
      <section className="workspace-grid" aria-label="Workspace">
        <BookOutline
          sections={activeProject.sections}
          selectedSectionId={previewSection?.id}
          onSelectSection={setSelectedSectionId}
        />
        <section className="preview-panel" aria-labelledby="preview-heading">
          <div className="preview-header">
            <h2 id="preview-heading">Preview</h2>
            <span>{previewSection?.title}</span>
          </div>
          <PreviewFrame srcDoc={previewHtml} />
        </section>
        <aside className="stack" aria-label="Project controls">
          <ImportActions onImported={handleImported} />
          <MetadataPanel metadata={activeProject.metadata} />
          <ImportReview
            report={importReport ?? undefined}
            projectPath={importedProjectPath}
            sectionCount={activeProject.sections.length}
          />
          <ThemeGallery />
          <ThemeEditor />
          <ValidationPanel />
        </aside>
      </section>
    </main>
  );
}
