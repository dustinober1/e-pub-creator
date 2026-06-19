import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBookProject } from "../src/book";
import { readProjectFolder, writeProjectFolder } from "../src/project-folder";

async function createWrittenProjectFolder() {
  const directory = await mkdtemp(join(tmpdir(), "epub-project-"));
  const project = createBookProject({ title: "Local Book", author: "A. Writer", language: "en" });

  await writeProjectFolder(directory, project);

  return { directory, project };
}

describe("project folder persistence", () => {
  it("writes a readable project manifest and content file", async () => {
    const { directory } = await createWrittenProjectFolder();
    const restored = await readProjectFolder(directory);
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));

    expect(manifest.formatVersion).toBe(1);
    expect(restored.metadata.title).toBe("Local Book");
  });

  it("creates the full project folder contract", async () => {
    const { directory } = await createWrittenProjectFolder();

    await expect(stat(join(directory, "content")).then((entry) => entry.isDirectory())).resolves.toBe(true);
    await expect(stat(join(directory, "assets")).then((entry) => entry.isDirectory())).resolves.toBe(true);
    await expect(stat(join(directory, "themes")).then((entry) => entry.isDirectory())).resolves.toBe(true);
    await expect(stat(join(directory, ".snapshots")).then((entry) => entry.isDirectory())).resolves.toBe(true);
  });

  it.each([
    {
      field: "app",
      patch: { app: "not-epub-creator" },
      expected: "Invalid project manifest app: not-epub-creator"
    },
    {
      field: "formatVersion",
      patch: { formatVersion: 2 },
      expected: "Unsupported project manifest format version: 2"
    },
    {
      field: "contentPath",
      patch: { contentPath: "book.json" },
      expected: "Invalid project manifest contentPath: book.json"
    },
    {
      field: "assetsPath",
      patch: { assetsPath: "project-assets" },
      expected: "Invalid project manifest assetsPath: project-assets"
    },
    {
      field: "themesPath",
      patch: { themesPath: "project-themes" },
      expected: "Invalid project manifest themesPath: project-themes"
    },
    {
      field: "snapshotsPath",
      patch: { snapshotsPath: "snapshots" },
      expected: "Invalid project manifest snapshotsPath: snapshots"
    }
  ])("rejects an invalid manifest $field", async ({ patch, expected }) => {
    const { directory } = await createWrittenProjectFolder();
    const manifestPath = join(directory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    await writeFile(manifestPath, `${JSON.stringify({ ...manifest, ...patch }, null, 2)}\n`);

    await expect(readProjectFolder(directory)).rejects.toThrow(expected);
  });

  it("rejects content whose project ID does not match the manifest", async () => {
    const { directory } = await createWrittenProjectFolder();
    const manifestPath = join(directory, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

    await writeFile(manifestPath, `${JSON.stringify({ ...manifest, projectId: "book_other" }, null, 2)}\n`);

    await expect(readProjectFolder(directory)).rejects.toThrow("Project manifest ID does not match project content");
  });

  it("rejects malformed project JSON even when the project format version is supported", async () => {
    const { directory, project } = await createWrittenProjectFolder();

    await writeFile(
      join(directory, "content", "book.json"),
      `${JSON.stringify(
        {
          id: project.id,
          formatVersion: 1,
          metadata: {},
          sections: [],
          assets: [],
          theme: {},
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        },
        null,
        2
      )}\n`
    );

    await expect(readProjectFolder(directory)).rejects.toThrow("Invalid project content: metadata.title must be a string");
  });

  it("rejects project assets with non-local or traversal paths", async () => {
    const { directory, project } = await createWrittenProjectFolder();

    await writeFile(
      join(directory, "content", "book.json"),
      `${JSON.stringify(
        {
          ...project,
          assets: [
            {
              id: "asset_bad",
              kind: "image",
              projectPath: "../outside.png",
              mediaType: "image/png",
              altText: "Bad path"
            }
          ]
        },
        null,
        2
      )}\n`
    );

    await expect(readProjectFolder(directory)).rejects.toThrow(
      "Invalid project content: asset projectPath must be bundle-local"
    );
  });
});
