import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBookProject } from "../src/book";
import { readProjectFolder, writeProjectFolder } from "../src/project-folder";

describe("project folder persistence", () => {
  it("writes a readable project manifest and content file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-project-"));
    const project = createBookProject({ title: "Local Book", author: "A. Writer", language: "en" });

    await writeProjectFolder(directory, project);
    const restored = await readProjectFolder(directory);
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));

    expect(manifest.formatVersion).toBe(1);
    expect(restored.metadata.title).toBe("Local Book");
  });
});
