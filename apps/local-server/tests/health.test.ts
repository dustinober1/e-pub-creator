import { describe, expect, it } from "vitest";
import { createServerApp } from "../src/server";

describe("local server", () => {
  it("responds to health checks", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
