import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBookProject,
  createSection,
  createSnapshot,
  createTextBlock,
  listSnapshots,
  readProjectFolder,
  readSnapshot,
  writeProjectFolder
} from "@epub-creator/core";

const importDocxBufferMock = vi.hoisted(() => vi.fn());
const copyProjectAssetSourcesMock = vi.hoisted(() => vi.fn());

vi.mock("@epub-creator/core", async () => {
  const actual = await vi.importActual<typeof import("@epub-creator/core")>("@epub-creator/core");

  return {
    ...actual,
    copyProjectAssetSources: copyProjectAssetSourcesMock
  };
});

vi.mock("@epub-creator/importers", async () => {
  const actual = await vi.importActual<typeof import("@epub-creator/importers")>("@epub-creator/importers");

  return {
    ...actual,
    importDocxBuffer: importDocxBufferMock
  };
});

import { createServerApp } from "../src/server";

copyProjectAssetSourcesMock.mockResolvedValue(undefined);

afterEach(() => {
  importDocxBufferMock.mockReset();
  copyProjectAssetSourcesMock.mockReset();
  copyProjectAssetSourcesMock.mockResolvedValue(undefined);
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

function saveRequest(body: string): Request {
  return new Request("http://127.0.0.1/api/projects/save", {
    method: "PUT",
    body,
    headers: { "content-type": "application/json" }
  });
}

function exportRequest(body: string): Request {
  return new Request("http://127.0.0.1/api/projects/export", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" }
  });
}

function snapshotListRequest(project: string): Request {
  return new Request(
    `http://127.0.0.1/api/projects/snapshots?project=${encodeURIComponent(project)}`
  );
}

function snapshotRestoreRequest(body: string): Request {
  return new Request("http://127.0.0.1/api/projects/snapshots/restore", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" }
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

function createBookProjectFixture(title = "Saved Book") {
  return {
    ...createBookProject({
      title,
      author: "A. Writer",
      language: "en"
    }),
    sections: [
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "Saved paragraph.")]
      })
    ]
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
        bookProject: { metadata: { title: string }; sections: unknown[] };
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
      const snapshotEntries = await readdir(join(project, ".snapshots"));

      expect(response.status).toBe(200);
      expect(body).toEqual({
        bookProject: {
          ...projectContent,
          assets: [],
          createdAt: expect.any(String),
          formatVersion: 1,
          id: expect.any(String),
          metadata: expect.objectContaining({ title: "Imported Book" }),
          theme: {
            overrides: {},
            packageId: "classic-literary"
          },
          updatedAt: expect.any(String)
        },
        project,
        sectionCount: 1,
        source,
        status: "imported",
        title: "Imported Book",
        warningCount: 1
      });
      expect(projectContent.metadata.title).toBe("Imported Book");
      expect(projectContent.sections).toHaveLength(1);
      expect(snapshotEntries).toHaveLength(1);
      expect(snapshotEntries[0]).toContain("before-import");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("creates a reimport snapshot before replacing an existing project", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-reimport-"));

    try {
      const source = join(directory, "book.md");
      const project = join(directory, "Draft.epubproj");
      const existingProject = createBookProjectFixture("Existing Title");

      await writeFile(source, "# Replacement Book\n\n## Chapter One\n\nReplacement paragraph.\n");
      await writeProjectFolder(project, existingProject);

      const app = createServerApp();
      const response = await app.handle(
        importRequest(JSON.stringify({ source, project }))
      );
      const snapshots = await listSnapshots(project);
      const restoredExisting = await readSnapshot(project, snapshots[0]?.id ?? "");
      const currentProject = await readProjectFolder(project);

      expect(response.status).toBe(200);
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]?.reason).toBe("before-reimport");
      expect(restoredExisting.metadata.title).toBe("Existing Title");
      expect(currentProject.metadata.title).toBe("Replacement Book");
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

  it("lists and restores project snapshots", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-snapshots-"));

    try {
      const project = join(directory, "Draft.epubproj");
      const first = createBookProjectFixture("First Title");
      await writeProjectFolder(project, first);
      const snapshot = await createSnapshot(project, first, "before-export");

      const second = createBookProjectFixture("Second Title");
      await writeProjectFolder(project, second);

      const app = createServerApp();
      const listResponse = await app.handle(snapshotListRequest(project));
      const listBody = (await listResponse.json()) as { snapshots: unknown[] };

      expect(listResponse.status).toBe(200);
      expect(listBody.snapshots).toHaveLength(1);

      const restoreResponse = await app.handle(
        snapshotRestoreRequest(JSON.stringify({ project, snapshotId: snapshot.id }))
      );
      const restoreBody = (await restoreResponse.json()) as {
        bookProject: { metadata: { title: string } };
      };
      const restored = await readProjectFolder(project);

      expect(restoreResponse.status).toBe(200);
      expect(restoreBody.bookProject.metadata.title).toBe("First Title");
      expect(restored.metadata.title).toBe("First Title");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rolls back snapshot restore when asset copying fails", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-snapshot-rollback-"));

    try {
      const project = join(directory, "Draft.epubproj");
      const first = createBookProjectFixture("First Title");
      await writeProjectFolder(project, first);
      const snapshot = await createSnapshot(project, first, "before-export");

      const second = createBookProjectFixture("Second Title");
      await writeProjectFolder(project, second);

      copyProjectAssetSourcesMock
        .mockRejectedValueOnce(new Error("Asset copy failed."))
        .mockResolvedValueOnce(undefined);

      const app = createServerApp();
      const response = await app.handle(
        snapshotRestoreRequest(JSON.stringify({ project, snapshotId: snapshot.id }))
      );
      const body = (await response.json()) as { error: string };
      const restored = await readProjectFolder(project);

      expect(response.status).toBe(400);
      expect(body.error).toContain("Snapshot restore failed: Asset copy failed.");
      expect(restored.metadata.title).toBe("Second Title");
      expect(copyProjectAssetSourcesMock).toHaveBeenCalledTimes(2);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("does not create a rollback snapshot when the target snapshot cannot be read", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-snapshot-missing-"));

    try {
      const project = join(directory, "Draft.epubproj");
      const current = createBookProjectFixture("Current Title");
      await writeProjectFolder(project, current);
      const snapshotsPath = join(project, ".snapshots");
      const beforeEntries = await readdir(snapshotsPath);

      const app = createServerApp();
      const response = await app.handle(
        snapshotRestoreRequest(
          JSON.stringify({ project, snapshotId: "missing-snapshot-id" })
        )
      );
      const body = (await response.json()) as { error: string };
      const afterEntries = await readdir(snapshotsPath);
      const restored = await readProjectFolder(project);

      expect(response.status).toBe(400);
      expect(body.error).toContain("Snapshot restore failed:");
      expect(afterEntries).toEqual(beforeEntries);
      expect(restored.metadata.title).toBe("Current Title");
      expect(copyProjectAssetSourcesMock).not.toHaveBeenCalled();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
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
      const snapshotEntries = await readdir(join(project, ".snapshots"));

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
      expect(snapshotEntries).toHaveLength(1);
      expect(snapshotEntries[0]).toContain("before-import");
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

describe("project save and export routes", () => {
  it("saves a provided book project into the requested project folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-save-"));

    try {
      const projectPath = join(directory, "Saved.epubproj");
      const bookProject = createBookProjectFixture();

      const app = createServerApp();
      const response = await app.handle(
        saveRequest(JSON.stringify({ project: ` ${projectPath} `, bookProject }))
      );
      const body = (await response.json()) as { project: string; status: string };
      const savedProject = JSON.parse(
        await readFile(join(projectPath, "content", "book.json"), "utf8")
      ) as { metadata: { title: string } };

      expect(response.status).toBe(200);
      expect(body).toEqual({ project: projectPath, status: "saved" });
      expect(savedProject.metadata.title).toBe("Saved Book");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("exports an epub after persisting the latest project state", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-export-"));

    try {
      const projectPath = join(directory, "Exported.epubproj");
      const outputPath = join(directory, "dist", "Exported.epub");
      const bookProject = createBookProjectFixture("Exported Book");

      const app = createServerApp();
      const response = await app.handle(
        exportRequest(
          JSON.stringify({
            project: projectPath,
            output: outputPath,
            profile: "portable-epub3",
            bookProject
          })
        )
      );
      const body = (await response.json()) as {
        issueCount: number;
        outputPath: string;
        project: string;
        status: string;
      };
      const savedProject = JSON.parse(
        await readFile(join(projectPath, "content", "book.json"), "utf8")
      ) as { metadata: { title: string } };
      const archive = await stat(outputPath);
      const snapshotEntries = await readdir(join(projectPath, ".snapshots"));

      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        issueCount: 0,
        outputPath,
        project: projectPath,
        status: "exported"
      });
      expect(savedProject.metadata.title).toBe("Exported Book");
      expect(archive.isFile()).toBe(true);
      expect(archive.size).toBeGreaterThan(0);
      expect(snapshotEntries).toHaveLength(1);
      expect(snapshotEntries[0]).toContain("before-export");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects invalid save and export payloads", async () => {
    const app = createServerApp();
    const invalidSave = await app.handle(
      saveRequest(JSON.stringify({ project: " \t ", bookProject: [] }))
    );
    const invalidExport = await app.handle(
      exportRequest(
        JSON.stringify({
          project: "/tmp/Draft.epubproj",
          output: "",
          profile: "unsupported",
          bookProject: "nope"
        })
      )
    );

    expect(invalidSave.status).toBe(400);
    await expect(invalidSave.json()).resolves.toEqual({
      error: "--project is required."
    });

    expect(invalidExport.status).toBe(400);
    await expect(invalidExport.json()).resolves.toEqual({
      error: "--output is required."
    });
  });

  it("rejects structurally invalid book projects during save without writing project files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-invalid-save-"));

    try {
      const projectPath = join(directory, "InvalidSave.epubproj");
      const app = createServerApp();
      const response = await app.handle(
        saveRequest(
          JSON.stringify({
            project: projectPath,
            bookProject: {
              metadata: { title: "Broken Book" },
              sections: []
            }
          })
        )
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "--bookProject is invalid."
      });
      await expect(stat(join(projectPath, "manifest.json"))).rejects.toMatchObject({
        code: "ENOENT"
      });
      await expect(stat(join(projectPath, "content", "book.json"))).rejects.toMatchObject({
        code: "ENOENT"
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects structurally invalid book projects during export without writing project files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-server-invalid-export-"));

    try {
      const projectPath = join(directory, "InvalidExport.epubproj");
      const outputPath = join(directory, "dist", "Invalid.epub");
      const app = createServerApp();
      const response = await app.handle(
        exportRequest(
          JSON.stringify({
            project: projectPath,
            output: outputPath,
            profile: "portable-epub3",
            bookProject: {
              id: "book-bad",
              formatVersion: 1,
              metadata: { title: "Broken Export" },
              sections: [],
              assets: [],
              theme: { packageId: "classic-literary", overrides: {} }
            }
          })
        )
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "--bookProject is invalid."
      });
      await expect(stat(join(projectPath, "manifest.json"))).rejects.toMatchObject({
        code: "ENOENT"
      });
      await expect(stat(join(projectPath, "content", "book.json"))).rejects.toMatchObject({
        code: "ENOENT"
      });
      await expect(stat(outputPath)).rejects.toMatchObject({
        code: "ENOENT"
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
