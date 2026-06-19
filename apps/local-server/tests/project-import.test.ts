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
  it("accepts import intent with trimmed source and project", async () => {
    const app = createServerApp();
    const response = await app.handle(importRequest(JSON.stringify({ source: "  book.docx ", project: " Draft " })));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      source: "book.docx",
      project: "Draft",
      status: "accepted"
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
