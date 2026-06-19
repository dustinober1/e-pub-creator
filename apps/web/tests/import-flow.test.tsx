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
});
