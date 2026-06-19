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

    const chapter = result.project.sections[1];
    expect(chapter?.blocks.map((block) => block.kind)).toEqual([
      "paragraph",
      "scene-break",
      "epigraph",
      "paragraph",
      "paragraph",
      "image"
    ]);
    expect(chapter?.blocks.map((block) => block.text)).toEqual([
      "The first paragraph begins with a sentence that should receive first-paragraph styling.",
      "",
      "This is an epigraph that should become a semantic epigraph block.",
      "Dear Reader,",
      "This letter-like block should remain editable as structured content.",
      "A sample plate"
    ]);
    expect(result.project.assets).toHaveLength(1);
    expect(result.project.assets[0]).toMatchObject({
      kind: "image",
      projectPath: "assets/images/001-sample-plate.png",
      mediaType: "image/png",
      altText: "A sample plate",
      caption: "A centered image plate",
      source: {
        type: "local-path",
        path: "fixtures/assets/sample-plate.png"
      }
    });
    expect(result.report.importedAssets).toEqual([
      {
        sourcePath: "fixtures/assets/sample-plate.png",
        altText: "A sample plate",
        caption: "A centered image plate"
      }
    ]);
    expect(result.report.warnings).toContainEqual({
      code: "IMAGE_REFERENCE_FOUND",
      message: "Imported local image reference: ../assets/sample-plate.png"
    });

    const imageBlock = chapter?.blocks[5];
    expect(imageBlock?.kind).toBe("image");
    expect(imageBlock).toMatchObject({
      assetId: result.project.assets[0]?.id
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

  it("creates unique safe project paths for duplicate image filenames", () => {
    const result = importMarkdown(
      [
        "# Book",
        "",
        "## Chapter",
        "",
        "![First plate](images/plate.png)",
        "",
        "![Second plate](other/plate.png)"
      ].join("\n"),
      {
        sourcePath: "fixtures/markdown/duplicates.md",
        author: "Sample Author",
        language: "en"
      }
    );

    expect(result.project.assets.map((asset) => asset.projectPath)).toEqual([
      "assets/images/001-plate.png",
      "assets/images/002-plate.png"
    ]);
    expect(result.project.assets.map((asset) => asset.source?.path)).toEqual([
      "fixtures/markdown/images/plate.png",
      "fixtures/markdown/other/plate.png"
    ]);
    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).toEqual(["image", "image"]);
  });

  it("warns and skips remote image asset creation", () => {
    const result = importMarkdown("# Book\n\n## Chapter\n\n![Remote](https://example.com/cover.png)", {
      sourcePath: "fixtures/markdown/remote.md",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.assets).toEqual([]);
    expect(result.report.importedAssets).toEqual([]);
    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).not.toContain("image");
    expect(result.report.warnings).toContainEqual({
      code: "IMAGE_REFERENCE_FOUND",
      message: "Remote image import is not supported yet: https://example.com/cover.png"
    });
  });

  it("warns and skips image references without a usable filename", () => {
    const result = importMarkdown(
      ["# Book", "", "## Chapter", "", "![Directory](../)", "", "![Dot](.)", "", "![Dot Dot](..)"].join("\n"),
      {
        sourcePath: "fixtures/markdown/invalid-images.md",
        author: "Sample Author",
        language: "en"
      }
    );

    expect(result.project.assets).toEqual([]);
    expect(result.report.importedAssets).toEqual([]);
    expect(result.report.warnings).toContainEqual({
      code: "IMAGE_REFERENCE_FOUND",
      message: "Skipped image reference with invalid filename: ../"
    });
    expect(result.report.warnings).toContainEqual({
      code: "IMAGE_REFERENCE_FOUND",
      message: "Skipped image reference with invalid filename: ."
    });
    expect(result.report.warnings).toContainEqual({
      code: "IMAGE_REFERENCE_FOUND",
      message: "Skipped image reference with invalid filename: .."
    });
  });
});
