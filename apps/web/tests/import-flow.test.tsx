import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImportActions } from "../src/components/ImportActions";

const originalFetch = globalThis.fetch;

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("ImportActions", () => {
  it("shows DOCX and Markdown import actions", () => {
    render(<ImportActions />);

    expect(screen.getByRole("button", { name: "Import DOCX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Markdown" })).toBeInTheDocument();
  });

  it("submits source and project paths for markdown imports", async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        project: "/tmp/Draft.epubproj",
        source: "/tmp/book.md",
        status: "imported",
        title: "Imported Book"
      })
    );
    render(<ImportActions />);

    fireEvent.change(screen.getByLabelText("Source path"), { target: { value: "/tmp/book.md" } });
    fireEvent.change(screen.getByLabelText("Project folder"), { target: { value: "/tmp/Draft.epubproj" } });
    fireEvent.click(screen.getByRole("button", { name: "Import Markdown" }));

    expect(await screen.findByText("Imported Book imported.")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/projects/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "/tmp/book.md", project: "/tmp/Draft.epubproj" })
    });
  });

  it("submits a selected DOCX file through the upload route with multipart FormData", async () => {
    const onImported = vi.fn();

    globalThis.fetch = vi.fn(async () =>
      Response.json({
        project: "/tmp/Draft.epubproj",
        source: "book.docx",
        status: "imported",
        title: "Imported DOCX",
        sectionCount: 2,
        warningCount: 1,
        bookProject: {
          id: "book-1",
          formatVersion: 1,
          metadata: {
            title: "Imported DOCX",
            author: "Author",
            language: "en",
            contributors: [],
            keywords: [],
            categories: [],
            identifier: "pub-1"
          },
          sections: [],
          assets: [],
          theme: {
            packageId: "classic-literary",
            overrides: {}
          },
          createdAt: "2026-06-19T00:00:00.000Z",
          updatedAt: "2026-06-19T00:00:00.000Z"
        },
        report: {
          sourcePath: "book.docx",
          warnings: [{ code: "warn-1", message: "Potential formatting issue." }],
          importedAssets: []
        }
      })
    );

    render(<ImportActions onImported={onImported} />);

    const file = new File(["docx-bytes"], "book.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    fireEvent.change(screen.getByLabelText("DOCX file"), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText("Project folder"), { target: { value: "/tmp/Draft.epubproj" } });
    fireEvent.click(screen.getByRole("button", { name: "Import DOCX" }));

    expect(await screen.findByText("Imported DOCX imported.")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(url).toBe("/api/projects/import/upload");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);

    const form = init?.body as FormData;
    expect(form.get("file")).toBe(file);
    expect(form.get("project")).toBe("/tmp/Draft.epubproj");
    expect(onImported).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "docx",
        response: expect.objectContaining({
          title: "Imported DOCX",
          project: "/tmp/Draft.epubproj"
        })
      })
    );
  });
});
