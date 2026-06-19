import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { App } from "../src/App";

const saveProjectMock = vi.hoisted(() => vi.fn());
const exportProjectMock = vi.hoisted(() => vi.fn());

afterEach(() => {
  cleanup();
  saveProjectMock.mockReset();
  exportProjectMock.mockReset();
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
              bookProject: {
                ...createBookProject({
                  title: "Markdown Import Summary",
                  author: "Markdown Author",
                  language: "en",
                }),
                sections: [
                  createSection({
                    title: "Markdown Chapter",
                    role: "body",
                    blocks: [
                      createTextBlock(
                        "paragraph",
                        "Markdown import body text.",
                      ),
                    ],
                  }),
                ],
              },
            },
          })
        }
      >
        Trigger Markdown Import
      </button>
    </section>
  ),
}));

vi.mock("../src/api/client", async () => {
  const actual = await vi.importActual<typeof import("../src/api/client")>("../src/api/client");

  return {
    ...actual,
    saveProject: saveProjectMock,
    exportProject: exportProjectMock
  };
});

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

  it("uses the imported markdown project state when markdown import provides it", async () => {
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
    expect(screen.getByText("Markdown Author / en")).toBeInTheDocument();
    expect(
      screen.getByText("Project folder: /tmp/MarkdownImport.epubproj"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Markdown Chapter" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByLabelText("Section title"),
    ).toHaveValue("Markdown Chapter");

    const preview = screen.getByTitle("EPUB XHTML preview");
    const srcDoc = preview.getAttribute("srcdoc") ?? "";
    expect(srcDoc).toContain("Markdown import body text.");
    expect(srcDoc).not.toContain("Fresh imported preview content.");
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

  it("uses the current project state for save and export actions", async () => {
    saveProjectMock.mockResolvedValue({
      status: "saved",
      project: "/tmp/Imported.epubproj"
    });
    exportProjectMock.mockResolvedValue({
      status: "exported",
      outputPath: "/tmp/output/Imported.epub",
      issueCount: 0
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Trigger DOCX Import" }));
    expect(
      await screen.findByRole("heading", {
        name: "Imported Through App State"
      })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Saved From App" }
    });

    expect(screen.getByLabelText("Project folder")).toHaveValue("/tmp/Imported.epubproj");

    fireEvent.click(screen.getByRole("button", { name: "Save Project" }));

    expect(
      await screen.findByText("Saved /tmp/Imported.epubproj.")
    ).toBeInTheDocument();
    expect(saveProjectMock).toHaveBeenCalledWith(
      "/tmp/Imported.epubproj",
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: "Saved From App"
        })
      })
    );

    fireEvent.change(screen.getByLabelText("EPUB output path"), {
      target: { value: "/tmp/output/Imported.epub" }
    });
    fireEvent.change(screen.getByLabelText("Export profile"), {
      target: { value: "kdp-safe" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Export EPUB" }));

    expect(
      await screen.findByText("Exported /tmp/output/Imported.epub with 0 issues.")
    ).toBeInTheDocument();
    expect(exportProjectMock).toHaveBeenCalledWith({
      project: "/tmp/Imported.epubproj",
      output: "/tmp/output/Imported.epub",
      profile: "kdp-safe",
      bookProject: expect.objectContaining({
        metadata: expect.objectContaining({
          title: "Saved From App"
        })
      })
    });
  });
});
