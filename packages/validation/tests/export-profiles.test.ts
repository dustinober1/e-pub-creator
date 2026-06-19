import { describe, expect, it } from "vitest";
import { validateExportProfile } from "../src/export-profiles";
import { createValidationReport, type ValidationIssue } from "../src/report";

describe("validateExportProfile", () => {
  it("warns when enhanced CSS is used in KDP-safe export", () => {
    const report = validateExportProfile("kdp-safe", ".chapter-title { position: sticky; }");

    expect(report.issues).toContainEqual({
      severity: "warning",
      code: "CSS_MAY_NOT_SURVIVE_KDP",
      message: "CSS property may be ignored by Kindle/KDP readers: position: sticky"
    });
  });

  it("matches KDP-sensitive CSS properties case-insensitively", () => {
    const report = validateExportProfile("kdp-safe", ".image { FLOAT: right; FILTER: blur(2px); }");

    expect(report.issues.map((issue) => issue.message)).toEqual([
      "CSS property may be ignored by Kindle/KDP readers: float:",
      "CSS property may be ignored by Kindle/KDP readers: filter:"
    ]);
  });

  it("strips CSS comments before matching KDP-sensitive declarations", () => {
    const report = validateExportProfile("kdp-safe", "/* position: sticky; filter: blur(1px); */ p { color: black; }");

    expect(report.issues).toEqual([]);
  });

  it("warns for backdrop-filter without also warning for filter", () => {
    const report = validateExportProfile("kdp-safe", ".panel { backdrop-filter: blur(4px); }");

    expect(report.issues.map((issue) => issue.message)).toEqual([
      "CSS property may be ignored by Kindle/KDP readers: backdrop-filter"
    ]);
  });

  it("warns for viewport height and width units", () => {
    const report = validateExportProfile("kdp-safe", ".spread { min-height: 100vh; width: 50vw; }");

    expect(report.issues.map((issue) => issue.message)).toEqual([
      "CSS property may be ignored by Kindle/KDP readers: vh",
      "CSS property may be ignored by Kindle/KDP readers: vw"
    ]);
  });

  it("returns no issues for clean KDP-safe CSS", () => {
    const report = validateExportProfile("kdp-safe", ".chapter { margin: 1rem 0; color: #111; }");

    expect(report.issues).toEqual([]);
  });

  it("does not report script selectors as script content for portable EPUB CSS", () => {
    expect(validateExportProfile("portable-epub3", ".script { font-style: italic; }").issues).toEqual([]);
    expect(validateExportProfile("portable-epub3", ".transcript { margin: 0; }").issues).toEqual([]);
  });

  it("reports active content markers in theme CSS", () => {
    const report = validateExportProfile("portable-epub3", "body{} </style><script>alert(1)</script>");

    expect(report.issues).toContainEqual({
      severity: "error",
      code: "CSS_ACTIVE_CONTENT_MARKER",
      message: "CSS contains active-content markers that are not allowed in EPUB themes."
    });
  });
});

describe("createValidationReport", () => {
  it("clones issues so caller mutations do not alter the report", () => {
    const issues: ValidationIssue[] = [
      {
        severity: "warning",
        code: "ORIGINAL",
        message: "Original issue"
      }
    ];

    const report = createValidationReport(issues);
    issues.push({
      severity: "error",
      code: "MUTATED",
      message: "Mutated issue"
    });
    issues[0] = {
      severity: "info",
      code: "REPLACED",
      message: "Replaced issue"
    };

    expect(report.issues).toEqual([
      {
        severity: "warning",
        code: "ORIGINAL",
        message: "Original issue"
      }
    ]);
  });
});
