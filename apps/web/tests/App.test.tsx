import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("renders project workspace surfaces", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Formatting Stress Book" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Book Outline" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Themes" })).toBeInTheDocument();

    const preview = screen.getByTitle("EPUB XHTML preview");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute("srcdoc", expect.stringContaining("<!doctype html>"));
    expect(preview).toHaveAttribute(
      "srcdoc",
      expect.stringContaining("body { font-family: Georgia, serif; line-height: 1.55; padding: 2rem; }")
    );

    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Chapter One");
    expect(srcDoc).toContain("The first paragraph tests ordinary prose flow and margins in the preview pane.");
    expect(srcDoc.match(/<!doctype html>/gi)).toHaveLength(1);
    expect(srcDoc.match(/<html\b/gi)).toHaveLength(1);
    expect(srcDoc).not.toContain("<?xml");
  });
});
