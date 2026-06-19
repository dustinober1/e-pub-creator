import { describe, expect, it } from "vitest";
import { importHtmlFragment } from "../src/html-to-book";

describe("importHtmlFragment", () => {
  it("converts mammoth-style HTML into semantic sections and notes", () => {
    const html = `
      <h1>Formatting Stress Book</h1>
      <h2>Chapter One</h2>
      <p>The first paragraph begins.</p>
      <blockquote>An epigraph line.</blockquote>
      <p><a href="#footnote-1" id="footnote-ref-1">1</a></p>
      <ol><li id="footnote-1">A preserved footnote.</li></ol>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections[0]?.title).toBe("Chapter One");
    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).toEqual([
      "paragraph",
      "epigraph",
      "footnote"
    ]);
  });
});
