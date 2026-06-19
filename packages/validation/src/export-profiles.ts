import { createValidationReport, type ValidationIssue, type ValidationReport } from "./report";

export type ExportProfile = "portable-epub3" | "kdp-safe" | "apple-books-enhanced";

const cssComments = /\/\*[\s\S]*?\*\//g;
const cssDeclaration = /(?<property>[\w-]+)\s*:\s*(?<value>[^;{}]+)(?:;|(?=}))?/g;

function createKdpWarning(token: string): ValidationIssue {
  return {
    severity: "warning",
    code: "CSS_MAY_NOT_SURVIVE_KDP",
    message: `CSS property may be ignored by Kindle/KDP readers: ${token}`
  };
}

export function validateExportProfile(profile: ExportProfile, css: string): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (profile === "kdp-safe") {
    const reportedTokens = new Set<string>();
    const uncommentedCss = css.replace(cssComments, "");

    for (const match of uncommentedCss.matchAll(cssDeclaration)) {
      const property = match.groups?.property.toLowerCase();
      const value = match.groups?.value ?? "";
      const tokens: string[] = [];

      if (property === "position" && /\bsticky\b/i.test(value)) {
        tokens.push("position: sticky");
      }

      if (property === "float") {
        tokens.push("float:");
      }

      if (property === "filter") {
        tokens.push("filter:");
      }

      if (property === "backdrop-filter") {
        tokens.push("backdrop-filter");
      }

      if (/\d*\.?\d+vh\b/i.test(value)) {
        tokens.push("vh");
      }

      if (/\d*\.?\d+vw\b/i.test(value)) {
        tokens.push("vw");
      }

      for (const token of tokens) {
        if (!reportedTokens.has(token)) {
          reportedTokens.add(token);
          issues.push(createKdpWarning(token));
        }
      }
    }
  }

  return createValidationReport(issues);
}
