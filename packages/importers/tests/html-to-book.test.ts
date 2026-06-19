import { beforeEach, describe, expect, it, vi } from "vitest";
import { importDocx, importDocxBuffer } from "../src/docx";
import { importHtmlFragment } from "../src/html-to-book";

const convertToHtmlMock = vi.hoisted(() => vi.fn());
const imgElementMock = vi.hoisted(() => vi.fn((handler: unknown) => handler));

vi.mock("mammoth", () => ({
  convertToHtml: convertToHtmlMock,
  images: {
    imgElement: imgElementMock
  }
}));

interface MammothConvertOptionsForTest {
  convertImage?: (image: MammothImageForTest) => Promise<Record<string, string>> | Record<string, string>;
}

interface MammothImageForTest {
  contentType: string;
  read: () => Promise<string>;
  readAsBase64String: () => Promise<string>;
  readAsBuffer: () => Promise<Buffer>;
}

beforeEach(() => {
  convertToHtmlMock.mockReset();
  imgElementMock.mockClear();
});

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

  it("treats h1 chapter headings as section boundaries", () => {
    const html = `
      <h1>Chapter One</h1>
      <p>The first paragraph begins.</p>
      <h1>Chapter Two</h1>
      <p>The next chapter begins.</p>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections.map((section) => section.title)).toEqual(["Chapter One", "Chapter Two"]);
    expect(result.project.sections.map((section) => section.blocks.map((block) => block.text))).toEqual([
      ["The first paragraph begins."],
      ["The next chapter begins."]
    ]);
  });

  it("keeps an h1 document title out of h2 section headings", () => {
    const html = `
      <h1>Formatting Stress Book</h1>
      <h2>Chapter One</h2>
      <p>The first paragraph begins.</p>
      <h2>Chapter Two</h2>
      <p>The next chapter begins.</p>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.metadata.title).toBe("Formatting Stress Book");
    expect(result.project.sections.map((section) => section.title)).toEqual(["Chapter One", "Chapter Two"]);
  });

  it("skips title-page text before h2 section structure with a warning", () => {
    const html = `
      <h1>Book Title</h1>
      <p>Author Name</p>
      <h2>Chapter One</h2>
      <p>The first paragraph begins.</p>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.metadata.title).toBe("Book Title");
    expect(result.project.sections.map((section) => section.title)).toEqual(["Chapter One"]);
    expect(result.project.sections[0]?.blocks.map((block) => block.text)).toEqual(["The first paragraph begins."]);
    expect(result.report.warnings).toContainEqual({
      code: "UNCLASSIFIED_BLOCK",
      message: "Skipped content before first section: Author Name"
    });
  });

  it("maps classed mammoth paragraphs to semantic blocks", () => {
    const html = `
      <h1>Formatting Stress Book</h1>
      <h2>Chapter One</h2>
      <p class="scene-break">* * *</p>
      <p class="letter">Dear Reader,</p>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).toEqual(["scene-break", "letter"]);
    expect(result.project.sections[0]?.blocks.map((block) => block.text)).toEqual(["", "Dear Reader,"]);
  });

  it("skips note reference paragraphs and removes backlink arrows from notes", () => {
    const html = `
      <h1>Formatting Stress Book</h1>
      <h2>Chapter One</h2>
      <p>The first paragraph begins.</p>
      <p><sup><a href="#footnote-1" id="footnote-ref-1">[1]</a></sup></p>
      <p><sup><a href="#endnote-1" id="endnote-ref-1">[2]</a></sup></p>
      <ol>
        <li id="footnote-1">A preserved footnote. <a href="#footnote-ref-1">↑</a></li>
        <li id="endnote-1">A preserved endnote. <a href="#endnote-ref-1">↑</a></li>
      </ol>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).toEqual([
      "paragraph",
      "footnote",
      "endnote"
    ]);
    expect(result.project.sections[0]?.blocks.map((block) => block.text)).toEqual([
      "The first paragraph begins.",
      "A preserved footnote.",
      "A preserved endnote."
    ]);
  });

  it("imports endnote body list items as endnote blocks", () => {
    const html = `
      <h1>Formatting Stress Book</h1>
      <h2>Chapter One</h2>
      <p>The first paragraph begins.</p>
      <ol><li id="endnote-1">A preserved endnote. <a href="#endnote-ref-1">↑</a></li></ol>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).toEqual(["paragraph", "endnote"]);
    expect(result.project.sections[0]?.blocks[1]?.text).toBe("A preserved endnote.");
  });
});

describe("importDocx", () => {
  it("calls mammoth with a path input object for file imports", async () => {
    convertToHtmlMock.mockResolvedValue({
      value: "<h1>Chapter One</h1><p>The first paragraph begins.</p>",
      messages: []
    });

    await importDocx("sample.docx", {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(convertToHtmlMock).toHaveBeenCalledWith(
      { path: "sample.docx" },
      expect.objectContaining({
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: true
      })
    );
  });

  it("calls mammoth with a buffer input object for buffer imports", async () => {
    const buffer = Buffer.from("docx bytes");

    convertToHtmlMock.mockResolvedValue({
      value: "<h1>Chapter One</h1><p>The first paragraph begins.</p>",
      messages: []
    });

    const result = await importDocxBuffer(buffer, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(convertToHtmlMock).toHaveBeenCalledWith(
      { buffer },
      expect.objectContaining({
        includeDefaultStyleMap: true,
        ignoreEmptyParagraphs: true
      })
    );
    expect(result.project.sections).toHaveLength(1);
  });

  it("preserves mammoth messages as import warnings", async () => {
    convertToHtmlMock.mockResolvedValue({
      value: "<h1>Chapter One</h1><p>The first paragraph begins.</p>",
      messages: [{ type: "warning", message: "Unrecognised paragraph style: Aside" }]
    });

    const result = await importDocx("sample.docx", {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.report.warnings).toContainEqual({
      code: "UNCLASSIFIED_BLOCK",
      message: "warning: Unrecognised paragraph style: Aside"
    });
  });

  it("warns about unsupported DOCX images without reading image data", async () => {
    const image: MammothImageForTest = {
      contentType: "image/png",
      read: vi.fn(async () => "encoded"),
      readAsBase64String: vi.fn(async () => "encoded"),
      readAsBuffer: vi.fn(async () => Buffer.from("encoded"))
    };

    convertToHtmlMock.mockImplementation(async (_input: unknown, options: MammothConvertOptionsForTest) => {
      expect(options.convertImage).toEqual(expect.any(Function));

      const attributes = await options.convertImage?.(image);

      expect(attributes).toMatchObject({
        alt: "Unsupported DOCX image"
      });
      expect(image.read).not.toHaveBeenCalled();
      expect(image.readAsBase64String).not.toHaveBeenCalled();
      expect(image.readAsBuffer).not.toHaveBeenCalled();

      return {
        value: "<h1>Chapter One</h1><p>The first paragraph begins.</p>",
        messages: []
      };
    });

    const result = await importDocx("sample.docx", {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(imgElementMock).toHaveBeenCalledWith(expect.any(Function));
    expect(result.report.warnings).toContainEqual({
      code: "IMAGE_REFERENCE_FOUND",
      message: "DOCX image import is not supported yet: image/png"
    });
  });
});
