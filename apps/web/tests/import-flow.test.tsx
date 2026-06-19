import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { importProject } from "../src/api/client";
import { ImportActions } from "../src/components/ImportActions";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("ImportActions", () => {
  it("shows DOCX and Markdown import actions", () => {
    render(<ImportActions />);

    expect(screen.getByRole("button", { name: "Import DOCX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Markdown" })).toBeInTheDocument();
  });
});

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
