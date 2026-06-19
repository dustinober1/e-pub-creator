import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { App } from "../src/App";

afterEach(() => {
  cleanup();
});

vi.mock("../src/components/ImportActions", () => ({
  ImportActions: ({
    onImported,
  }: {
    onImported?: (result: unknown) => void;
  }) => (
    <section aria-label="Import actions">
      <button
        type="button"
        onClick={() =>
          onImported?.({
            kind: "docx",
            response: {
              project: "/tmp/Imported.epubproj",
              source: "Imported.docx",
              status: "imported",
              title: "Imported Through App State",
              sectionCount: 2,
              warningCount: 1,
              bookProject: {
                ...createBookProject({
                  title: "Imported Through App State",
                  author: "Imported Author",
                  language: "fr",
                }),
                sections: [
                  createSection({
                    title: "Imported Opening",
                    role: "body",
                    blocks: [
                      createTextBlock(
                        "paragraph",
                        "Fresh imported preview content.",
                      ),
                    ],
                  }),
                  createSection({
                    title: "Imported Finale",
                    role: "back",
                    blocks: [createTextBlock("paragraph", "Closing notes.")],
                  }),
                ],
              },
              report: {
                sourcePath: "Imported.docx",
                warnings: [
                  {
                    code: "missing-alt",
                    message: "One image is missing alt text.",
                  },
                ],
                importedAssets: [
                  { sourcePath: "cover.png", altText: "Cover art" },
                ],
              },
            },
          })
        }
      >
        Trigger DOCX Import
      </button>
      <button
        type="button"
        onClick={() =>
          onImported?.({
            kind: "markdown",
            response: {
              project: "/tmp/MarkdownImport.epubproj",
              source: "/tmp/book.md",
              status: "imported",
              title: "Markdown Import Summary",
            },
          })
        }
      >
        Trigger Markdown Import
      </button>
    </section>
  ),
}));

describe("App", () => {
  it("renders project workspace surfaces", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Formatting Stress Book" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Book Outline" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Themes" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Theme Editor" }),
    ).toBeInTheDocument();

    const preview = screen.getByTitle("EPUB XHTML preview");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute("sandbox", "");
    expect(preview).toHaveAttribute(
      "srcdoc",
      expect.stringContaining("<!doctype html>"),
    );
    expect(preview).toHaveAttribute(
      "srcdoc",
      expect.stringContaining(
        "body { font-family: Georgia, serif; line-height: 1.55; padding: 2rem; }",
      ),
    );

    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Chapter One");
    expect(srcDoc).toContain(
      "The first paragraph tests ordinary prose flow and margins in the preview pane.",
    );
    expect(srcDoc.match(/<!doctype html>/gi)).toHaveLength(1);
    expect(srcDoc.match(/<html\b/gi)).toHaveLength(1);
    expect(srcDoc).not.toContain("<?xml");
  });

  it("replaces the sample shell with imported project state", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Imported Author / fr")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Imported Opening" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByText("2 sections ready from Imported.docx."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Project folder: /tmp/Imported.epubproj"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("One image is missing alt text."),
    ).toBeInTheDocument();

    const preview = screen.getByTitle("EPUB XHTML preview");
    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Fresh imported preview content.");

    fireEvent.click(screen.getByRole("button", { name: "Imported Finale" }));

    expect(
      screen.getByRole("button", { name: "Imported Finale" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Imported Opening" }),
    ).not.toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Imported Finale" }),
    ).toBeInTheDocument();
    expect(preview.getAttribute("srcdoc") ?? "").toContain("Closing notes.");
    expect(preview.getAttribute("srcdoc") ?? "").not.toContain(
      "Fresh imported preview content.",
    );
  });

  it("replaces prior content with a neutral markdown import summary state", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger Markdown Import" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Markdown Import Summary" }),
    ).toBeInTheDocument();
    expect(screen.getByText("/ und")).toBeInTheDocument();
    expect(
      screen.getByText("Project folder: /tmp/MarkdownImport.epubproj"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Imported project summary loaded. Detailed section review is not available for this source yet.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select a section to edit its title, role, and text blocks.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("One image is missing alt text."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Imported Opening" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Section title")).not.toBeInTheDocument();

    const preview = screen.getByTitle("EPUB XHTML preview");
    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).not.toContain("Fresh imported preview content.");
    expect(srcDoc).not.toContain(
      "The first paragraph tests ordinary prose flow and margins in the preview pane.",
    );
  });

  it("updates visible header text when metadata is edited", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Edited Book Title" },
    });
    fireEvent.change(screen.getByLabelText("Author"), {
      target: { value: "Edited Author" },
    });
    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "es" },
    });

    expect(
      screen.getByRole("heading", { name: "Edited Book Title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Edited Author / es")).toBeInTheDocument();
  });

  it("updates preview output when editing the selected section", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Section title"), {
      target: { value: "Opening Scene" },
    });
    fireEvent.change(screen.getByLabelText("Block 1 (paragraph)"), {
      target: { value: "Updated preview body copy." },
    });

    expect(
      screen.getByRole("button", { name: "Opening Scene" }),
    ).toHaveAttribute("aria-current", "true");

    const preview = screen.getByTitle("EPUB XHTML preview");
    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Opening Scene");
    expect(srcDoc).toContain("Updated preview body copy.");
    expect(srcDoc).not.toContain(
      "The first paragraph tests ordinary prose flow and margins in the preview pane.",
    );
  });

  it("switches outline selection and edits the newly selected section", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Trigger DOCX Import" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Imported Finale" }));
    fireEvent.change(screen.getByLabelText("Section title"), {
      target: { value: "Afterword" },
    });
    fireEvent.change(screen.getByLabelText("Block 1 (paragraph)"), {
      target: { value: "Revised closing copy." },
    });

    expect(screen.getByRole("button", { name: "Afterword" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Imported Opening" }),
    ).not.toHaveAttribute("aria-current", "true");

    const preview = screen.getByTitle("EPUB XHTML preview");
    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Afterword");
    expect(srcDoc).toContain("Revised closing copy.");
    expect(srcDoc).not.toContain("Closing notes.");
  });
});
