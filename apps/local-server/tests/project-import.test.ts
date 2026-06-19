import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createServerApp } from "../src/server";

function importRequest(body: string): Request {
  return new Request("http://127.0.0.1/api/projects/import", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" }
  });
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
