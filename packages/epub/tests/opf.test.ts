import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createAsset, createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { EPUB_MIMETYPE } from "../src/mimetype";
import { renderOpf } from "../src/opf";
import { createEpubPackage } from "../src/package-epub";
import { writeEpubFile } from "../src/write-epub";

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

describe("writeEpubFile", () => {
  it("writes a real EPUB zip with mimetype first and copied assets", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-writer-"));

    try {
      const projectDirectory = join(directory, "Project");
      const assetDirectory = join(projectDirectory, "assets", "images");
      const outputPath = join(directory, "book.epub");
      const assetBytes = Uint8Array.from([137, 80, 78, 71]);
      await mkdir(assetDirectory, { recursive: true });
      await writeFile(join(assetDirectory, "plate.png"), assetBytes);

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
          blocks: [createTextBlock("paragraph", "Opening."), createTextBlock("image", "", { assetId: asset.id })]
        })
      );

      const packageResult = createEpubPackage(project, "body { line-height: 1.5; }", "portable-epub3");
      await writeEpubFile({ projectDirectory, outputPath, packageResult });

      const entries = readStoredZipEntries(await readFile(outputPath));

      expect(entries.map((entry) => entry.name)).toEqual([
        "mimetype",
        "META-INF/container.xml",
        "EPUB/package.opf",
        "EPUB/nav.xhtml",
        "EPUB/styles/book.css",
        "EPUB/sections/section-1.xhtml",
        "EPUB/assets/images/plate.png"
      ]);
      expect(new TextDecoder().decode(entries[0]?.content)).toBe(EPUB_MIMETYPE);
      expect(entries[0]?.method).toBe(0);
      expect(Array.from(entries.find((entry) => entry.name === "EPUB/assets/images/plate.png")?.content ?? [])).toEqual(
        Array.from(assetBytes)
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

function readStoredZipEntries(buffer: Uint8Array): Array<{ name: string; method: number; content: Uint8Array }> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const entries: Array<{ name: string; method: number; content: Uint8Array }> = [];
  let offset = 0;

  while (view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const contentEnd = contentStart + compressedSize;
    const name = new TextDecoder().decode(buffer.slice(nameStart, nameStart + nameLength));
    const content = buffer.slice(contentStart, contentEnd);

    entries.push({ name, method, content });
    offset = contentEnd;
  }

  return entries;
}
