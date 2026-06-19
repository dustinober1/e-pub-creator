import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const importDocxBufferMock = vi.hoisted(() => vi.fn());

vi.mock("@epub-creator/importers", async () => {
  const actual = await vi.importActual<typeof import("@epub-creator/importers")>("@epub-creator/importers");

  return {
    ...actual,
    importDocxBuffer: importDocxBufferMock
  };
});

import { createServerApp } from "../src/server";

afterEach(() => {
  importDocxBufferMock.mockReset();
});

function importRequest(body: string): Request {
  return new Request("http://127.0.0.1/api/projects/import", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" }
  });
}

function importUploadRequest(form: FormData): Request {
  return new Request("http://127.0.0.1/api/projects/import/upload", {
    method: "POST",
    body: form
  });
}

function createImportedDocxResult(title = "Uploaded Book") {
  return {
    project: {
      metadata: {
        title
      },
      sections: [
        {
          id: "section-1",
          title: "Chapter One",
          blocks: []
        }
      ],
      assets: [],
      notes: []
    },
    report: {
      warnings: [{ code: "UNCLASSIFIED_BLOCK", message: "warning" }],
      stats: { durationMs: 0 }
    }
  };
}

describe("project import route", () => {
  it("imports markdown into a persisted project folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-import-"));

    try {
      const source = join(directory, "book.md");
      const project = join(directory, "Draft.epubproj");
      await writeFile(source, "# Imported Book\n\n## Chapter One\n\nImported paragraph.\n");

      const app = createServerApp();
      const response = await app.handle(importRequest(JSON.stringify({ source: ` ${source} `, project: ` ${project} ` })));
      const body = (await response.json()) as {
        project: string;
        sectionCount: number;
        source: string;
        status: string;
        title: string;
        warningCount: number;
      };
      const projectContent = JSON.parse(await readFile(join(project, "content", "book.json"), "utf8")) as {
        metadata: { title: string };
        sections: unknown[];
      };

      expect(response.status).toBe(200);
      expect(body).toEqual({
        project,
        sectionCount: 1,
        source,
        status: "imported",
        title: "Imported Book",
        warningCount: 1
      });
      expect(projectContent.metadata.title).toBe("Imported Book");
      expect(projectContent.sections).toHaveLength(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects import requests when the source file cannot be read", async () => {
    const app = createServerApp();
    const response = await app.handle(importRequest(JSON.stringify({ source: "  book.docx ", project: " Draft " })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Import failed:")
    });
  });

  it("rejects import without a source path", async () => {
    const app = createServerApp();
    const response = await app.handle(importRequest(JSON.stringify({ project: "Draft" })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "--source is required." });
  });

  it("rejects import without a project name", async () => {
    const app = createServerApp();
    const response = await app.handle(importRequest(JSON.stringify({ source: "book.docx" })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "--project is required." });
  });

  it("treats whitespace-only strings as missing", async () => {
    const app = createServerApp();
    const missingSource = await app.handle(importRequest(JSON.stringify({ source: "  ", project: "Draft" })));
    const missingProject = await app.handle(importRequest(JSON.stringify({ source: "book.docx", project: "\t" })));

    expect(missingSource.status).toBe(400);
    await expect(missingSource.json()).resolves.toEqual({ error: "--source is required." });
    expect(missingProject.status).toBe(400);
    await expect(missingProject.json()).resolves.toEqual({ error: "--project is required." });
  });

  it("rejects non-string source and project values", async () => {
    const app = createServerApp();
    const invalidSource = await app.handle(importRequest(JSON.stringify({ source: 123, project: "Draft" })));
    const invalidProject = await app.handle(importRequest(JSON.stringify({ source: "book.docx", project: false })));

    expect(invalidSource.status).toBe(400);
    await expect(invalidSource.json()).resolves.toEqual({ error: "--source must be a string." });
    expect(invalidProject.status).toBe(400);
    await expect(invalidProject.json()).resolves.toEqual({ error: "--project must be a string." });
  });

  it("rejects invalid JSON", async () => {
    const app = createServerApp();
    const response = await app.handle(importRequest("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON body." });
  });

  it("rejects non-object request bodies", async () => {
    const app = createServerApp();
    const response = await app.handle(importRequest(JSON.stringify(["book.docx"])));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Request body must be an object." });
  });

  it("rejects non-POST methods with POST allow header", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/projects/import", { method: "GET" }));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    await expect(response.json()).resolves.toEqual({ error: "Method not allowed" });
  });
});

describe("project import upload route", () => {
  it("imports an uploaded docx into a persisted project folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-upload-"));

    try {
      const project = join(directory, "Draft.epubproj");
      importDocxBufferMock.mockResolvedValueOnce(createImportedDocxResult());

      const form = new FormData();
      form.set("file", new File([Buffer.from("docx bytes")], "book.docx"));
      form.set("project", project);
      form.set("author", "Sample Author");
      form.set("language", "fr");

      const app = createServerApp();
      const response = await app.handle(importUploadRequest(form));
      const body = (await response.json()) as {
        bookProject: { metadata: { title: string }; sections: unknown[] };
        project: string;
        report: { warnings: unknown[] };
        sectionCount: number;
        source: string;
        status: string;
        title: string;
        warningCount: number;
      };
      const projectContent = JSON.parse(await readFile(join(project, "content", "book.json"), "utf8")) as {
        metadata: { title: string };
        sections: unknown[];
      };

      expect(response.status).toBe(200);
      expect(importDocxBufferMock).toHaveBeenCalledWith(Buffer.from("docx bytes"), {
        sourcePath: "book.docx",
        author: "Sample Author",
        language: "fr"
      });
      expect(body).toMatchObject({
        source: "book.docx",
        project,
        status: "imported",
        title: "Uploaded Book",
        sectionCount: 1,
        warningCount: 1
      });
      expect(body.bookProject.metadata.title).toBe("Uploaded Book");
      expect(body.report.warnings).toHaveLength(1);
      expect(projectContent.metadata.title).toBe("Uploaded Book");
      expect(projectContent.sections).toHaveLength(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("imports an uploaded docx without persisting when project is omitted", async () => {
    importDocxBufferMock.mockResolvedValueOnce(createImportedDocxResult("Unpersisted Book"));

    const form = new FormData();
    form.set("file", new File([Buffer.from("docx bytes")], "book.docx"));
    form.set("author", "Sample Author");
    form.set("language", "en");

    const app = createServerApp();
    const response = await app.handle(importUploadRequest(form));
    const body = (await response.json()) as {
      bookProject: { metadata: { title: string }; sections: unknown[] };
      report: { warnings: unknown[] };
      sectionCount: number;
      source: string;
      status: string;
      title: string;
      warningCount: number;
      project?: string;
    };

    expect(response.status).toBe(200);
    expect(importDocxBufferMock).toHaveBeenCalledWith(Buffer.from("docx bytes"), {
      sourcePath: "book.docx",
      author: "Sample Author",
      language: "en"
    });
    expect(body).toMatchObject({
      source: "book.docx",
      status: "imported",
      title: "Unpersisted Book",
      sectionCount: 1,
      warningCount: 1
    });
    expect(body.bookProject.metadata.title).toBe("Unpersisted Book");
    expect(body.report.warnings).toHaveLength(1);
    expect(body).not.toHaveProperty("project");
  });

  it("rejects upload requests without a file", async () => {
    const form = new FormData();
    form.set("project", "Draft.epubproj");

    const app = createServerApp();
    const response = await app.handle(importUploadRequest(form));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "DOCX file is required." });
  });

  it("rejects uploads that are not docx files", async () => {
    const form = new FormData();
    form.set("file", new File([Buffer.from("text")], "book.txt"));
    form.set("project", "Draft.epubproj");

    const app = createServerApp();
    const response = await app.handle(importUploadRequest(form));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Only .docx uploads are supported." });
  });

  it("rejects uploads over the configured size limit", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array(25 * 1024 * 1024 + 1)], "book.docx"));
    form.set("project", "Draft.epubproj");

    const app = createServerApp();
    const response = await app.handle(importUploadRequest(form));

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: "DOCX upload is too large." });
  });

  it("rejects oversized uploads from content-length before multipart parsing", async () => {
    const app = createServerApp();
    const response = await app.handle(
      new Request("http://127.0.0.1/api/projects/import/upload", {
        method: "POST",
        body: "ignored",
        headers: {
          "content-length": String(25 * 1024 * 1024 + 1),
          "content-type": "multipart/form-data; boundary=upload-boundary"
        }
      })
    );

    expect(response.status).toBe(413);
    expect(importDocxBufferMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "DOCX upload is too large." });
  });

  it("rejects malformed multipart form data with a controlled 400", async () => {
    const app = createServerApp();
    const response = await app.handle(
      new Request("http://127.0.0.1/api/projects/import/upload", {
        method: "POST",
        body: "--broken",
        headers: {
          "content-type": "multipart/form-data"
        }
      })
    );

    expect(response.status).toBe(400);
    expect(importDocxBufferMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "Invalid multipart form data." });
  });

  it("rejects non-POST methods with POST allow header", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/projects/import/upload", { method: "GET" }));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    await expect(response.json()).resolves.toEqual({ error: "Method not allowed" });
  });
});
