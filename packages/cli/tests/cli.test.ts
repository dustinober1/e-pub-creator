import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { exportCommand } from "../src/commands/export";
import { importCommand } from "../src/commands/import";
import { validateCommand } from "../src/commands/validate";
import { runCli } from "../src/index";

describe("runCli", () => {
  it("returns usage for help", async () => {
    await expect(runCli([])).resolves.toContain("Usage: epub-creator <command> [flags]");
  });

  it("rejects unknown commands", async () => {
    await expect(runCli(["nope"])).rejects.toThrow("Unknown command: nope");
  });
});

describe("CLI commands", () => {
  it("requires import source and project flags", async () => {
    await expect(importCommand({ source: "book.md" })).rejects.toThrow("Missing required --project flag");
  });

  it("requires validate project flag", async () => {
    await expect(validateCommand({})).rejects.toThrow("Missing required --project flag");
  });

  it("rejects invalid export profiles", async () => {
    await expect(exportCommand({ project: "Book.epubproj", profile: "kindle" })).rejects.toThrow(
      "Unsupported export profile: kindle"
    );
  });

  it("resolves path flags relative to the original script directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-creator-cli-cwd-"));
    const previousInitCwd = process.env.INIT_CWD;

    try {
      process.env.INIT_CWD = directory;
      await writeFile(join(directory, "book.md"), "# Relative Book\n\n## Chapter 1\n\nA short paragraph.\n");

      const importOutput = JSON.parse(await importCommand({ source: "book.md", project: "Book.epubproj" })) as {
        project: string;
        title: string;
      };
      const projectContent = JSON.parse(
        await readFile(join(directory, "Book.epubproj", "content", "book.json"), "utf8")
      ) as { metadata: { title: string } };

      expect(importOutput).toMatchObject({
        project: join(directory, "Book.epubproj"),
        title: "Relative Book"
      });
      expect(projectContent.metadata.title).toBe("Relative Book");
    } finally {
      if (previousInitCwd === undefined) {
        delete process.env.INIT_CWD;
      } else {
        process.env.INIT_CWD = previousInitCwd;
      }
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("imports, validates, and exports a local markdown project", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-creator-cli-"));

    try {
      const markdownPath = join(directory, "book.md");
      const projectPath = join(directory, "Book.epubproj");
      await writeFile(markdownPath, "# Test Book\n\n## Chapter 1\n\nA short paragraph.\n");

      const importOutput = JSON.parse(await importCommand({ source: markdownPath, project: projectPath })) as {
        title: string;
        warningCount: number;
      };
      const projectContent = JSON.parse(await readFile(join(projectPath, "content", "book.json"), "utf8")) as {
        metadata: { author: string; language: string };
      };
      const validationOutput = JSON.parse(await validateCommand({ project: projectPath })) as {
        issues: unknown[];
      };
      const outputPath = join(directory, "TestBook.epub");
      const exportOutput = JSON.parse(
        await exportCommand({ project: projectPath, profile: "portable-epub3", output: outputPath })
      ) as {
        fileCount: number;
        issueCount: number;
        outputPath: string;
        profile: string;
      };
      const exportedBytes = await readFile(outputPath);

      expect(importOutput).toEqual({
        project: projectPath,
        title: "Test Book",
        warningCount: 1
      });
      expect(projectContent.metadata).toMatchObject({
        author: "Unknown Author",
        language: "en"
      });
      expect(validationOutput.issues).toHaveLength(0);
      expect(exportOutput).toMatchObject({
        fileCount: 6,
        issueCount: 0,
        outputPath,
        profile: "portable-epub3"
      });
      expect(Array.from(exportedBytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
