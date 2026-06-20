import type { BookProject } from "@epub-creator/core/book";
import type { UploadImportReport } from "../api/client";

interface ImportReviewProps {
  bookProject: BookProject;
  report?: UploadImportReport;
  projectPath?: string;
}

function countSceneBreaks(bookProject: BookProject): number {
  return bookProject.sections.reduce((total, section) => {
    return (
      total +
      section.blocks.filter((block) => block.kind === "scene-break").length
    );
  }, 0);
}

export function ImportReview({ bookProject, report, projectPath }: ImportReviewProps) {
  const sectionCount = bookProject.sections.length;
  const warningCount = report?.warnings.length ?? 0;
  const altTextCount =
    report?.importedAssets.filter((asset) => asset.altText.trim().length > 0)
      .length ?? 0;
  const sceneBreakCount = countSceneBreaks(bookProject);

  return (
    <section className="panel import-review-panel" aria-labelledby="import-review-heading">
      <h2 id="import-review-heading">Import Cleanup</h2>
      {projectPath ? <p className="panel-copy">Project folder: {projectPath}</p> : null}
      <ul className="import-cleanup-list" aria-label="Import cleanup checklist">
        <li className="import-cleanup-item">
          <span className="import-cleanup-label">Sections</span>
          <span className="import-cleanup-value">
            {sectionCount} {sectionCount === 1 ? "section" : "sections"}
          </span>
        </li>
        <li className="import-cleanup-item">
          <span className="import-cleanup-label">Warnings</span>
          <span className="import-cleanup-value">
            {warningCount} {warningCount === 1 ? "note" : "notes"}
          </span>
        </li>
        <li className="import-cleanup-item">
          <span className="import-cleanup-label">Alt text</span>
          <span className="import-cleanup-value">
            {altTextCount} {altTextCount === 1 ? "asset" : "assets"}
          </span>
        </li>
        <li className="import-cleanup-item">
          <span className="import-cleanup-label">Scene breaks</span>
          <span className="import-cleanup-value">
            {sceneBreakCount} {sceneBreakCount === 1 ? "scene break" : "scene breaks"}
          </span>
        </li>
      </ul>
      <div className="import-notes" aria-labelledby="import-notes-heading">
        <h3 id="import-notes-heading">Import notes</h3>
        {report ? (
          report.warnings.length > 0 ? (
            <ul className="import-note-list" aria-label="Import notes">
              {report.warnings.map((warning) => (
                <li key={`${warning.code}-${warning.message}`} className="import-note">
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-copy">No import notes.</p>
          )
        ) : (
          <p className="panel-copy">Import a DOCX file to capture cleanup notes here.</p>
        )}
      </div>
    </section>
  );
}
