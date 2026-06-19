import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { importMarkdown } from "../src/markdown";

describe("importMarkdown", () => {
  it("normalizes Markdown into an explicit book outline", async () => {
    const markdown = await readFile("fixtures/markdown/formatting-stress.md", "utf8");
    const result = importMarkdown(markdown, {
      sourcePath: "fixtures/markdown/formatting-stress.md",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.metadata.title).toBe("Formatting Stress Book");
    expect(result.project.sections.map((section) => section.title)).toEqual([
      "Copyright",
      "Chapter One",
      "About the Author"
    ]);
    expect(result.project.sections.map((section) => section.role)).toEqual(["front", "body", "back"]);
    expect(result.report.warnings).toContainEqual({
      code: "IMPORT_REVIEW_REQUIRED",
      message: "Review detected section roles and block classifications before export."
    });
  });

  it("classifies exact also by headings as back matter", () => {
    const result = importMarkdown("# Book\n\n## Also By\n\nAnother Book", {
      sourcePath: "fixtures/markdown/also-by.md",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections).toHaveLength(1);
    expect(result.project.sections[0]?.role).toBe("back");
  });
});
