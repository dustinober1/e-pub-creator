import { describe, expect, it } from "vitest";
import { createAsset, createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { validateAccessibility } from "../src/accessibility";

describe("validateAccessibility", () => {
  it("reports missing language, alt text, and table of contents issues", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "" });
    const asset = createAsset({
      kind: "image",
      projectPath: "assets/images/plate.png",
      mediaType: "image/png",
      altText: ""
    });
    project.assets.push(asset);
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "", { assetId: asset.id })],
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

  it("uses linked asset alt text instead of image block text", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "en" });
    const asset = createAsset({
      kind: "image",
      projectPath: "assets/images/plate.png",
      mediaType: "image/png",
      altText: ""
    });
    project.assets.push(asset);
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "Decorative plate", { assetId: asset.id })],
        includeInToc: true
      })
    );

    const report = validateAccessibility(project);

    expect(report.issues).toContainEqual({
      severity: "error",
      code: "IMAGE_ALT_REQUIRED",
      message: "Image asset requires alt text in section: Chapter One",
      path: `${project.sections[0]?.id}/${project.sections[0]?.blocks[0]?.id}`
    });
  });

  it("accepts image blocks with empty text when linked asset alt text is present", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "en" });
    const asset = createAsset({
      kind: "image",
      projectPath: "assets/images/plate.png",
      mediaType: "image/png",
      altText: "A decorative plate."
    });
    project.assets.push(asset);
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "", { assetId: asset.id })],
        includeInToc: true
      })
    );

    const report = validateAccessibility(project);

    expect(report.issues.map((issue) => issue.code)).not.toContain("IMAGE_ALT_REQUIRED");
  });

  it("reports image blocks that reference missing assets", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "en" });
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "Decorative plate", { assetId: "asset_missing" })],
        includeInToc: true
      })
    );

    const section = project.sections[0];
    const block = section?.blocks[0];
    const report = validateAccessibility(project);

    expect(report.issues).toContainEqual({
      severity: "error",
      code: "IMAGE_ASSET_MISSING",
      message: "Image block references a missing asset in section: Chapter One",
      path: `${section?.id}/${block?.id}`
    });
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

    expect(report.issues).toContainEqual({
      severity: "error",
      code: "TOC_ENTRY_REQUIRED",
      message: "At least one body section must be included in the table of contents.",
      path: project.sections[1]?.id
    });
  });
});
