import type { BookProject } from "@epub-creator/core";
import { createValidationReport, type ValidationIssue, type ValidationReport } from "./report";

export function validateAccessibility(project: BookProject): ValidationReport {
  const issues: ValidationIssue[] = [];
  const assetsById = new Map(project.assets.map((asset) => [asset.id, asset]));

  if (!project.metadata.language.trim()) {
    issues.push({
      severity: "error",
      code: "LANGUAGE_REQUIRED",
      message: "Book language metadata is required."
    });
  }

  for (const section of project.sections) {
    for (const block of section.blocks) {
      if (block.kind !== "image") {
        continue;
      }

      const asset = assetsById.get(block.assetId);

      if (!asset) {
        issues.push({
          severity: "error",
          code: "IMAGE_ASSET_MISSING",
          message: `Image block references a missing asset in section: ${section.title}`,
          path: `${section.id}/${block.id}`
        });
        continue;
      }

      if (!asset.altText.trim()) {
        issues.push({
          severity: "error",
          code: "IMAGE_ALT_REQUIRED",
          message: `Image asset requires alt text in section: ${section.title}`,
          path: `${section.id}/${block.id}`
        });
      }
    }
  }

  const bodySections = project.sections.filter((section) => section.role === "body");

  if (bodySections.length > 0 && !bodySections.some((section) => section.includeInToc)) {
    issues.push({
      severity: "error",
      code: "TOC_ENTRY_REQUIRED",
      message: "At least one body section must be included in the table of contents.",
      path: bodySections[0]?.id ?? "sections"
    });
  }

  return createValidationReport(issues);
}
