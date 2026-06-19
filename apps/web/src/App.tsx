import { useState } from "react";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { renderSectionFragment } from "@epub-creator/renderer/html";
import { createPreviewDocument } from "@epub-creator/renderer/preview";
import type { BookProject, BookSection } from "@epub-creator/core/book";
import type { UploadImportReport } from "./api/client";
import { BookOutline } from "./components/BookOutline";
import {
  ImportActions,
  type ImportCompletion,
} from "./components/ImportActions";
import { ImportReview } from "./components/ImportReview";
import {
  MetadataPanel,
  type EditableMetadata,
} from "./components/MetadataPanel";
import { PreviewFrame } from "./components/PreviewFrame";
import { SectionEditor } from "./components/SectionEditor";
import { ThemeEditor } from "./components/ThemeEditor";
import { ThemeGallery } from "./components/ThemeGallery";
import { ValidationPanel } from "./components/ValidationPanel";

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

function createImportedMarkdownProject(title: string) {
  return createBookProject({
    title,
    author: "",
    language: "und",
  });
}

export function App() {
  const [activeProject, setActiveProject] = useState(sampleProject);
  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >(sampleProject.sections[0]?.id);
  const [importedProjectPath, setImportedProjectPath] = useState<string>();
  const [importReport, setImportReport] = useState<UploadImportReport>();
  const selectedSection = activeProject.sections.find(
    (section) => section.id === selectedSectionId,
  );
  const previewSection = selectedSection ?? activeProject.sections[0];
  const renderedSections = previewSection
    ? renderSectionFragment(activeProject, previewSection)
    : "";
  const previewHtml = createPreviewDocument(
    activeProject,
    renderedSections,
    "body { font-family: Georgia, serif; line-height: 1.55; padding: 2rem; }",
  );

  function updateProject(recipe: (project: BookProject) => BookProject): void {
    setActiveProject((currentProject) => ({
      ...recipe(currentProject),
      updatedAt: new Date().toISOString(),
    }));
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

  function handleImported(result: ImportCompletion): void {
    if (result.kind === "docx") {
      setActiveProject(result.response.bookProject);
      setImportedProjectPath(result.response.project);
      setSelectedSectionId(result.response.bookProject.sections[0]?.id);
      setImportReport(result.response.report);
      return;
    }

    const placeholderProject = createImportedMarkdownProject(
      result.response.title ?? result.response.project,
    );
    setActiveProject(placeholderProject);
    setImportedProjectPath(result.response.project);
    setSelectedSectionId(undefined);
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
          <MetadataPanel
            metadata={activeProject.metadata}
            onChange={handleMetadataChange}
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
