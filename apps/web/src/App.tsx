import { createBookProject, createSection, createTextBlock } from "@epub-creator/core/book";
import { renderSectionFragment } from "@epub-creator/renderer/html";
import { createPreviewDocument } from "@epub-creator/renderer/preview";
import { BookOutline } from "./components/BookOutline";
import { ImportActions } from "./components/ImportActions";
import { ImportReview } from "./components/ImportReview";
import { MetadataPanel } from "./components/MetadataPanel";
import { PreviewFrame } from "./components/PreviewFrame";
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
  const previewSection = sampleProject.sections[0];
  const renderedSections = previewSection ? renderSectionFragment(sampleProject, previewSection) : "";
  const previewHtml = createPreviewDocument(
    sampleProject,
    renderedSections,
    "body { font-family: Georgia, serif; line-height: 1.55; padding: 2rem; }"
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{sampleProject.metadata.title}</h1>
          <p>
            {sampleProject.metadata.author} / {sampleProject.metadata.language}
          </p>
        </div>
      </header>
      <section className="workspace-grid" aria-label="Workspace">
        <BookOutline sections={sampleProject.sections} />
        <section className="preview-panel" aria-labelledby="preview-heading">
          <div className="preview-header">
            <h2 id="preview-heading">Preview</h2>
            <span>{previewSection?.title}</span>
          </div>
          <PreviewFrame srcDoc={previewHtml} />
        </section>
        <aside className="stack" aria-label="Project controls">
          <ImportActions />
          <MetadataPanel metadata={sampleProject.metadata} />
          <ImportReview />
          <ThemeGallery />
          <ValidationPanel />
        </aside>
      </section>
    </main>
  );
}
