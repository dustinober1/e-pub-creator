import { describe, expect, it } from "vitest";
import { createServerApp } from "../src/server";

describe("local server", () => {
  it("responds to health checks", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("lists available themes", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/themes"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      themes: [
        { id: "classic-literary", name: "Classic Literary" },
        { id: "modern-clean", name: "Modern Clean" }
      ]
    });
  });

  it("returns the current project state", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/projects"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ openProject: null, recentProjects: [] });
  });

  it("returns JSON 404 for unknown routes", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/missing"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("rejects unsupported methods on read-only routes", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/health", { method: "POST" }));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
    await expect(response.json()).resolves.toEqual({ error: "Method not allowed" });
  });
});
