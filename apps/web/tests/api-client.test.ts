import { afterEach, describe, expect, it, vi } from "vitest";
import { importProject, uploadDocxProject } from "../src/api/client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function createUploadResponse(overrides: Record<string, unknown> = {}) {
  return {
    source: "book.docx",
    status: "imported",
    title: "Imported Book",
    sectionCount: 3,
    warningCount: 1,
    bookProject: {
      id: "book-1",
      formatVersion: 1,
      metadata: {
        title: "Imported Book",
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
      warnings: [],
      importedAssets: []
    },
    ...overrides
  };
}

describe("importProject", () => {
  it("propagates server JSON errors", async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ error: "--source is required." }, { status: 400 }));

    await expect(importProject("", "Draft")).rejects.toThrow("--source is required.");
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/projects/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "", project: "Draft" })
    });
  });

  it("falls back to status when an error response is not JSON", async () => {
    globalThis.fetch = vi.fn(async () => new Response("nope", { status: 500 }));

    await expect(importProject("book.docx", "Draft")).rejects.toThrow("Import failed: 500");
  });
});

describe("uploadDocxProject", () => {
  it("submits a FormData body without a manual multipart header", async () => {
    globalThis.fetch = vi.fn(async () => Response.json(createUploadResponse({ project: "/tmp/Draft.epubproj" })));

    const file = new File(["docx-bytes"], "book.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    await uploadDocxProject({ file });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(url).toBe("/api/projects/import/upload");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);

    const form = init?.body as FormData;
    expect(form.get("file")).toBe(file);
    expect(form.get("project")).toBeNull();
    expect(form.get("author")).toBeNull();
    expect(form.get("language")).toBeNull();
  });

  it("includes optional fields when they are provided", async () => {
    globalThis.fetch = vi.fn(async () => Response.json(createUploadResponse({ project: "/tmp/Draft.epubproj" })));

    const file = new File(["docx-bytes"], "book.docx");

    await uploadDocxProject({
      file,
      project: "/tmp/Draft.epubproj",
      author: "Author",
      language: "fr"
    });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    const form = init?.body as FormData;

    expect(form.get("file")).toBe(file);
    expect(form.get("project")).toBe("/tmp/Draft.epubproj");
    expect(form.get("author")).toBe("Author");
    expect(form.get("language")).toBe("fr");
  });

  it("accepts a successful upload response without a project path", async () => {
    globalThis.fetch = vi.fn(async () => Response.json(createUploadResponse()));

    const file = new File(["docx-bytes"], "book.docx");
    const result = await uploadDocxProject({ file });

    expect(result.project).toBeUndefined();
    expect(result.bookProject.metadata.title).toBe("Imported Book");
    expect(result.report.sourcePath).toBe("book.docx");
  });

  it("surfaces JSON error bodies", async () => {
    globalThis.fetch = vi.fn(async () => Response.json({ error: "Bad DOCX upload." }, { status: 400 }));

    const file = new File(["docx-bytes"], "book.docx");

    await expect(uploadDocxProject({ file })).rejects.toThrow("Bad DOCX upload.");
  });

  it("falls back to status when an error response is not JSON", async () => {
    globalThis.fetch = vi.fn(async () => new Response("nope", { status: 502 }));

    const file = new File(["docx-bytes"], "book.docx");

    await expect(uploadDocxProject({ file })).rejects.toThrow("Upload failed: 502");
  });
});
