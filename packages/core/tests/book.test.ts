import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "../src/book";

describe("core book model", () => {
  it("creates a book project with explicit front/body/back sections", () => {
    const project = createBookProject({
      title: "Formatting Stress Book",
      author: "Sample Author",
      language: "en"
    });

    project.sections.push(
      createSection({
        title: "Copyright",
        role: "front",
        blocks: [createTextBlock("paragraph", "Copyright 2026 Sample Author.")]
      }),
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "The first paragraph begins.")]
      }),
      createSection({
        title: "About the Author",
        role: "back",
        blocks: [createTextBlock("paragraph", "Sample Author writes books.")]
      })
    );

    expect(project.metadata.title).toBe("Formatting Stress Book");
    expect(project.sections.map((section) => section.role)).toEqual(["front", "body", "back"]);
    expect(project.sections[1]?.blocks[0]?.kind).toBe("paragraph");
  });
});
