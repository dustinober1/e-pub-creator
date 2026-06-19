import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { validateAccessibility } from "../src/accessibility";

describe("validateAccessibility", () => {
  it("reports missing language, alt text, and table of contents issues", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "" });
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "", { assetId: "plate.png" })],
        includeInToc: false
      })
    );

    const report = validateAccessibility(project);

    expect(report.issues.map((issue) => issue.code)).toEqual([
      "LANGUAGE_REQUIRED",
      "IMAGE_ALT_REQUIRED",
      "TOC_ENTRY_REQUIRED"
    ]);
  });

  it("requires a body section in the table of contents", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "en" });
    project.sections.push(
      createSection({
        title: "Preface",
        role: "front",
        blocks: [createTextBlock("paragraph", "Before the book.")],
        includeInToc: true
      }),
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "The book begins.")],
        includeInToc: false
      })
    );

    const report = validateAccessibility(project);

    expect(report.issues.map((issue) => issue.code)).toContain("TOC_ENTRY_REQUIRED");
  });
});
