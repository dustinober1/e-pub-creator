import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { renderOpf } from "../src/opf";

describe("renderOpf", () => {
  it("renders EPUB 3 package metadata and manifest entries", () => {
    const project = createBookProject({ title: "Export Book", author: "A. Writer", language: "en" });
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "Opening.")]
      })
    );

    const opf = renderOpf(project);

    expect(opf).toContain('version="3.0"');
    expect(opf).toContain("<dc:title>Export Book</dc:title>");
    expect(opf).toContain('properties="nav"');
  });
});
