import { createValidationReport, type ValidationIssue, type ValidationReport } from "./report";

export type ExportProfile = "portable-epub3" | "kdp-safe" | "apple-books-enhanced";

const kdpSensitiveCss = ["position: sticky", "float:", "filter:", "backdrop-filter", "vh", "vw"];

export function validateExportProfile(profile: ExportProfile, css: string): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (profile === "kdp-safe") {
    for (const token of kdpSensitiveCss) {
      if (css.includes(token)) {
        issues.push({
          severity: "warning",
          code: "CSS_MAY_NOT_SURVIVE_KDP",
          message: `CSS property may be ignored by Kindle/KDP readers: ${token}`
        });
      }
    }
  }

  if (profile === "portable-epub3" && /script\b/i.test(css)) {
    issues.push({
      severity: "error",
      code: "SCRIPT_NOT_ALLOWED",
      message: "Portable EPUB 3 export does not allow script content."
    });
  }

  return createValidationReport(issues);
}
