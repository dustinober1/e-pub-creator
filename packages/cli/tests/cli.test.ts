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
      const exportOutput = JSON.parse(await exportCommand({ project: projectPath, profile: "portable-epub3" })) as {
        fileCount: number;
        issueCount: number;
        profile: string;
      };

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
        profile: "portable-epub3"
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
