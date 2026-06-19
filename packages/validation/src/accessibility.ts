import type { BookProject } from "@epub-creator/core";
import { createValidationReport, type ValidationIssue, type ValidationReport } from "./report";

export function validateAccessibility(project: BookProject): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (!project.metadata.language.trim()) {
    issues.push({
      severity: "error",
      code: "LANGUAGE_REQUIRED",
      message: "Book language metadata is required."
    });
  }

  for (const section of project.sections) {
    for (const block of section.blocks) {
      if (block.kind === "image" && !block.text.trim()) {
        issues.push({
          severity: "error",
          code: "IMAGE_ALT_REQUIRED",
          message: `Image block requires alt text in section: ${section.title}`,
          path: `${section.id}/${block.id}`
        });
      }
    }
  }

  if (
    project.sections.some((section) => section.role === "body") &&
    !project.sections.some((section) => section.includeInToc)
  ) {
    issues.push({
      severity: "error",
      code: "TOC_ENTRY_REQUIRED",
      message: "At least one body section must be included in the table of contents."
    });
  }

  return createValidationReport(issues);
}
