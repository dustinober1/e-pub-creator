import { describe, expect, it } from "vitest";
import { createAsset, createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { mergeCss } from "../src/css";
import { renderSectionXhtml } from "../src/html";
import { renderNavXhtml } from "../src/nav";

describe("renderSectionXhtml", () => {
  it("renders semantic blocks as EPUB XHTML", () => {
    const project = createBookProject({ title: "Render Book", author: "A. Writer", language: "en" });
    const section = createSection({
      title: "Chapter One",
      role: "body",
      blocks: [
        createTextBlock("paragraph", "Opening paragraph."),
        createTextBlock("scene-break", ""),
        createTextBlock("epigraph", "A line before the chapter.")
      ]
    });

    const xhtml = renderSectionXhtml(project, section);

    expect(xhtml).toContain('<section epub:type="chapter"');
    expect(xhtml).toContain('<header class="chapter-title"><h1>Chapter One</h1></header>');
    expect(xhtml).toContain('<p class="paragraph">Opening paragraph.</p>');
    expect(xhtml).toContain('<div class="scene-break" aria-hidden="true"></div>');
    expect(xhtml).toContain('<blockquote class="epigraph">A line before the chapter.</blockquote>');
  });

  it("escapes text and renders specialized EPUB block semantics", () => {
    const project = createBookProject({ title: "Render <Book>", author: "A. Writer", language: "en" });
    const image = createAsset({
      kind: "image",
      projectPath: "assets/images/plate.png",
      mediaType: "image/png",
      altText: "Plate & caption"
    });
    project.assets.push(image);
    const section = createSection({
      title: "Chapter & Two",
      role: "body",
      blocks: [
        createTextBlock("chapter-title", "Custom <Title>"),
        createTextBlock("heading", "A Subhead", { level: 3 }),
        createTextBlock("blockquote", "Quoted & true."),
        createTextBlock("letter", "Dear <reader>,"),
        createTextBlock("email", "sender@example.com"),
        createTextBlock("message", "Text me > later."),
        createTextBlock("poem", "First line\nSecond line"),
        createTextBlock("image", "Ignored alt", { assetId: image.id }),
        createTextBlock("footnote", "Footnote text.", { noteId: "fn-1" }),
        createTextBlock("endnote", "Endnote text.", { noteId: "en-1" })
      ]
    });

    const xhtml = renderSectionXhtml(project, section);

    expect(xhtml).toContain("<title>Chapter &amp; Two</title>");
    expect(xhtml).toContain('<h1 class="chapter-title">Custom &lt;Title&gt;</h1>');
    expect(xhtml).toContain('<h3 class="heading">A Subhead</h3>');
    expect(xhtml).toContain('<blockquote class="blockquote">Quoted &amp; true.</blockquote>');
    expect(xhtml).toContain('<div class="letter">Dear &lt;reader&gt;,</div>');
    expect(xhtml).toContain('<div class="email">sender@example.com</div>');
    expect(xhtml).toContain('<div class="message">Text me &gt; later.</div>');
    expect(xhtml).toContain('<div class="poem"><p>First line</p><p>Second line</p></div>');
    expect(xhtml).toContain('<img src="../assets/images/plate.png" alt="Plate &amp; caption" />');
    expect(xhtml).toContain('<aside id="fn-1" epub:type="footnote" class="footnote">Footnote text.</aside>');
    expect(xhtml).toContain('<aside id="en-1" epub:type="endnote" class="endnote">Endnote text.</aside>');
  });
});

describe("renderNavXhtml", () => {
  it("renders only table-of-contents sections", () => {
    const project = createBookProject({ title: "Nav Book", author: "A. Writer", language: "en" });
    project.sections.push(
      createSection({ title: "Copyright", role: "front", includeInToc: false, blocks: [] }),
      createSection({ title: "Chapter <One>", role: "body", includeInToc: true, blocks: [] })
    );

    const nav = renderNavXhtml(project);

    expect(nav).toContain('<nav epub:type="toc" id="toc">');
    expect(nav).toContain("Chapter &lt;One&gt;");
    expect(nav).toContain('href="sections/section-2.xhtml"');
    expect(nav).not.toContain("Copyright");
  });

  it("renders TOC hrefs from exported section positions instead of generated ids", () => {
    const project = createBookProject({ title: "Nav Book", author: "A. Writer", language: "en" });
    project.sections.push(
      {
        ...createSection({ title: "Prologue", role: "front", includeInToc: true, blocks: [] }),
        id: "generated-prologue-id"
      },
      {
        ...createSection({ title: "Chapter One", role: "body", includeInToc: true, blocks: [] }),
        id: "generated-chapter-id"
      },
      {
        ...createSection({ title: "Acknowledgments", role: "back", includeInToc: false, blocks: [] }),
        id: "generated-back-id"
      }
    );

    const nav = renderNavXhtml(project);

    expect(nav).toContain('href="sections/section-1.xhtml"');
    expect(nav).toContain('href="sections/section-2.xhtml"');
    expect(nav).not.toContain("generated-prologue-id.xhtml");
    expect(nav).not.toContain("generated-chapter-id.xhtml");
    expect(nav).not.toContain("sections/section-3.xhtml");
  });
});

describe("mergeCss", () => {
  it("appends custom properties when overrides exist", () => {
    const css = mergeCss("body { color: black; }", {
      "--accent": "#333",
      accentColor: "#444",
      fontBody: "Georgia"
    });

    expect(css).toContain("body { color: black; }");
    expect(css).toContain(":root {");
    expect(css).toContain("--accent: #333;");
    expect(css).toContain("--accent-color: #444;");
    expect(css).toContain("--font-body: Georgia;");
  });
});
