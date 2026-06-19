import { describe, expect, it } from "vitest";
import { validateExportProfile } from "../src/export-profiles";

describe("validateExportProfile", () => {
  it("warns when enhanced CSS is used in KDP-safe export", () => {
    const report = validateExportProfile("kdp-safe", ".chapter-title { position: sticky; }");

    expect(report.issues).toContainEqual({
      severity: "warning",
      code: "CSS_MAY_NOT_SURVIVE_KDP",
      message: "CSS property may be ignored by Kindle/KDP readers: position: sticky"
    });
  });
});
