import { describe, expect, it } from "vitest";
import { createAsset, createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { EPUB_MIMETYPE } from "../src/mimetype";
import { renderOpf } from "../src/opf";
import { createEpubPackage } from "../src/package-epub";

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
    const modified = new Date(project.updatedAt).toISOString().replace(/\.\d{3}Z$/, "Z");

    expect(opf).toContain('version="3.0"');
    expect(opf).toContain("<dc:title>Export Book</dc:title>");
    expect(opf).toContain(`property="dcterms:modified">${modified}</meta>`);
    expect(opf).toContain('properties="nav"');
  });

  it("escapes metadata values", () => {
    const project = createBookProject({
      title: "Bread & <Butter>",
      author: "A. Writer & Co.",
      language: "en"
    });

    const opf = renderOpf(project);

    expect(opf).toContain("<dc:title>Bread &amp; &lt;Butter&gt;</dc:title>");
    expect(opf).toContain("<dc:creator>A. Writer &amp; Co.</dc:creator>");
  });

  it("renders section manifest and spine entries", () => {
    const project = createBookProject({ title: "Export Book", author: "A. Writer", language: "en" });
    project.sections.push(
      createSection({ title: "Chapter One", role: "body", blocks: [] }),
      createSection({ title: "Chapter Two", role: "body", blocks: [] })
    );

    const opf = renderOpf(project);

    expect(opf).toContain('id="section-1" href="sections/section-1.xhtml" media-type="application/xhtml+xml"');
    expect(opf).toContain('id="section-2" href="sections/section-2.xhtml" media-type="application/xhtml+xml"');
    expect(opf).toContain('<itemref idref="section-1" />');
    expect(opf).toContain('<itemref idref="section-2" />');
  });

  it("renders image asset manifest entries", () => {
    const project = createBookProject({ title: "Export Book", author: "A. Writer", language: "en" });
    const asset = createAsset({
      kind: "image",
      projectPath: "assets/images/plate.png",
      mediaType: "image/png",
      altText: "Plate"
    });
    project.assets.push(asset);
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "", { assetId: asset.id })]
      })
    );

    const opf = renderOpf(project);

    expect(opf).toContain('id="asset-1" href="assets/images/plate.png" media-type="image/png"');
  });
});

describe("createEpubPackage", () => {
  it("creates package documents, asset copy descriptors, and a combined report", () => {
    const project = createBookProject({ title: "Export Book", author: "A. Writer", language: "en" });
    const asset = createAsset({
      kind: "image",
      projectPath: "assets/images/plate.png",
      mediaType: "image/png",
      altText: "",
      source: { type: "local-path", path: "/tmp/plate.png" }
    });
    project.assets.push(asset);
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "Opening."), createTextBlock("image", "", { assetId: asset.id })]
      })
    );

    const result = createEpubPackage(project, ".float { float: left; }", "kdp-safe");

    expect(result.files[0]).toMatchObject({
      path: "mimetype",
      content: EPUB_MIMETYPE,
      mediaType: EPUB_MIMETYPE
    });
    expect(result.files.map((file) => file.path)).toEqual([
      "mimetype",
      "META-INF/container.xml",
      "EPUB/package.opf",
      "EPUB/nav.xhtml",
      "EPUB/styles/book.css",
      "EPUB/sections/section-1.xhtml"
    ]);
    expect(result.assetFiles).toEqual([
      {
        path: "EPUB/assets/images/plate.png",
        projectPath: "assets/images/plate.png",
        assetId: asset.id,
        mediaType: "image/png",
        sourcePath: "/tmp/plate.png"
      }
    ]);
    expect(result.report.issues.map((issue) => issue.code)).toEqual([
      "IMAGE_ALT_REQUIRED",
      "CSS_MAY_NOT_SURVIVE_KDP"
    ]);
  });
});
