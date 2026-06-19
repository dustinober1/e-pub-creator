import { describe, expect, it } from "vitest";
import { createAsset } from "../src/assets";
import { createBookProject, createSection, createTextBlock, type TextBlock } from "../src/book";

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
    expect(project.sections[0]?.id).toMatch(/^section_/);
    expect(project.sections[1]?.blocks[0]?.id).toMatch(/^block_/);
    expect(project.sections[1]?.blocks[0]?.kind).toBe("paragraph");
  });

  it("defaults durable project metadata and registries", () => {
    const project = createBookProject({
      title: "Formatting Stress Book",
      author: "Sample Author",
      language: "en"
    });

    expect(project.id).toMatch(/^book_/);
    expect(project.formatVersion).toBe(1);
    expect(project.metadata.identifier).toMatch(/^publication_/);
    expect(project.assets).toEqual([]);
    expect(project.createdAt).toBe(project.updatedAt);
    expect(project.theme.packageId).toBe("classic-literary");
  });

  it("uses an explicit publication identifier when provided", () => {
    const project = createBookProject({
      title: "Formatting Stress Book",
      author: "Sample Author",
      language: "en",
      identifier: "urn:isbn:9780000000000"
    });

    expect(project.metadata.identifier).toBe("urn:isbn:9780000000000");
  });

  it("defaults table of contents inclusion by section role", () => {
    expect(createSection({ title: "Copyright", role: "front", blocks: [] }).includeInToc).toBe(false);
    expect(createSection({ title: "Chapter One", role: "body", blocks: [] }).includeInToc).toBe(true);
    expect(createSection({ title: "About the Author", role: "back", blocks: [] }).includeInToc).toBe(false);
  });

  it("creates portable project assets with optional import provenance", () => {
    const asset = createAsset({
      kind: "image",
      projectPath: "assets/images/cover.png",
      mediaType: "image/png",
      altText: "Cover",
      source: {
        type: "local-path",
        path: "/tmp/import/cover.png"
      }
    });

    expect(asset.id).toMatch(/^asset_/);
    expect(asset.projectPath).toBe("assets/images/cover.png");
    expect(asset.source).toEqual({
      type: "local-path",
      path: "/tmp/import/cover.png"
    });
  });

  it("creates typed text blocks for planned importer calls", () => {
    const blocks: TextBlock[] = [
      createTextBlock("paragraph", "The first paragraph begins."),
      createTextBlock("scene-break", ""),
      createTextBlock("epigraph", "A line before the chapter."),
      createTextBlock("heading", "Chapter One", { level: 1 }),
      createTextBlock("image", "Cover image", { assetId: "asset_cover" })
    ];

    expect(blocks.map((block) => block.kind)).toEqual([
      "paragraph",
      "scene-break",
      "epigraph",
      "heading",
      "image"
    ]);
  });
});

if (false) {
  createAsset({
    kind: "image",
    projectPath: "assets/images/cover.png",
    mediaType: "image/png",
    altText: "Cover"
  });

  createAsset({
    kind: "image",
    // @ts-expect-error Durable assets store optional source provenance, not a required local sourcePath.
    sourcePath: "/tmp/import/cover.png",
    projectPath: "assets/images/cover.png",
    mediaType: "image/png",
    altText: "Cover"
  });

  // @ts-expect-error Persisted image blocks require assetId.
  const imageBlock: TextBlock = { id: "block_image", kind: "image", text: "Cover image" };

  // @ts-expect-error Persisted heading blocks require level.
  const headingBlock: TextBlock = { id: "block_heading", kind: "heading", text: "Chapter One" };

  // @ts-expect-error Image block factory calls require assetId.
  createTextBlock("image", "Cover image");

  // @ts-expect-error Heading block factory calls require level.
  createTextBlock("heading", "Chapter One");

  void imageBlock;
  void headingBlock;
}
