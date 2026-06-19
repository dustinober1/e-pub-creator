import type { UploadImportReport } from "../api/client";

interface ImportReviewProps {
  report?: UploadImportReport;
  projectPath?: string;
  sectionCount: number;
}

export function ImportReview({ report, projectPath, sectionCount }: ImportReviewProps) {
  if (!report) {
    return (
      <section className="panel" aria-labelledby="import-review-heading">
        <h2 id="import-review-heading">Import Review</h2>
        {projectPath ? <p className="panel-copy">Project folder: {projectPath}</p> : null}
        <p className="panel-copy">
          {projectPath
            ? "Imported project summary loaded. Detailed section review is not available for this source yet."
            : "No import report yet. Import a project to review sections, warnings, and assets."}
        </p>
      </section>
    );
  }

  const sectionLabel = `${sectionCount} ${sectionCount === 1 ? "section" : "sections"} ready from ${report.sourcePath}.`;
  const assetLabel =
    report.importedAssets.length > 0
      ? `${report.importedAssets.length} imported ${report.importedAssets.length === 1 ? "asset" : "assets"}.`
      : "No imported assets recorded.";

  return (
    <section className="panel" aria-labelledby="import-review-heading">
      <h2 id="import-review-heading">Import Review</h2>
      <p className="panel-copy">{sectionLabel}</p>
      {projectPath ? <p className="panel-copy">Project folder: {projectPath}</p> : null}
      <p className="panel-copy">{assetLabel}</p>
      {report.warnings.length > 0 ? (
        <ul aria-label="Import warnings">
          {report.warnings.map((warning) => (
            <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
          ))}
        </ul>
      ) : (
        <p className="panel-copy">No import warnings.</p>
      )}
    </section>
  );
}
