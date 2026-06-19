import { describe, expect, it } from "vitest";
import { createBookProject } from "@epub-creator/core";
import { createPreviewDocument } from "../src/preview";

describe("createPreviewDocument", () => {
  it("wraps rendered content in an iframe-ready XHTML document", () => {
    const project = createBookProject({ title: "Preview Book", author: "A. Writer", language: "en" });
    const html = createPreviewDocument(project, "<section>Body</section>", "body { color: #111; }");

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Preview Book</title>");
    expect(html).toContain("body { color: #111; }");
  });

  it("escapes document metadata while preserving body markup", () => {
    const project = createBookProject({ title: "Preview <Book>", author: "A. Writer", language: "en" });
    const html = createPreviewDocument(project, "<section>Body</section>", "body::before { content: '<'; }");

    expect(html).toContain("<title>Preview &lt;Book&gt;</title>");
    expect(html).toContain("<section>Body</section>");
    expect(html).toContain("body::before { content: '<'; }");
  });

  it("prevents theme CSS from closing the style element", () => {
    const project = createBookProject({ title: "Preview Book", author: "A. Writer", language: "en" });
    const html = createPreviewDocument(project, "<section>Body</section>", "body{} </style><script>alert(1)</script>");

    expect(html).not.toContain("</style><script>");
    expect(html).toContain("<\\/style><script>alert(1)</script>");
  });
});
