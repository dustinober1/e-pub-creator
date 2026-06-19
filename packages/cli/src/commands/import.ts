import { readFile } from "node:fs/promises";
import { writeProjectFolder } from "@epub-creator/core";
import { importMarkdown } from "@epub-creator/importers";
import type { ParsedArgs } from "../parse-args";

type CliFlags = ParsedArgs["flags"];

export async function importCommand(flags: CliFlags): Promise<string> {
  const source = readRequiredStringFlag(flags, "source");
  const projectPath = readRequiredStringFlag(flags, "project");
  const markdown = await readFile(source, "utf8");
  const result = importMarkdown(markdown, {
    sourcePath: source,
    author: readOptionalStringFlag(flags, "author") ?? "Unknown Author",
    language: readOptionalStringFlag(flags, "language") ?? "en"
  });

  await writeProjectFolder(projectPath, result.project);

  return JSON.stringify(
    {
      project: projectPath,
      title: result.project.metadata.title,
      warningCount: result.report.warnings.length
    },
    null,
    2
  );
}

function readRequiredStringFlag(flags: CliFlags, name: string): string {
  const value = readOptionalStringFlag(flags, name);

  if (!value) {
    throw new Error(`Missing required --${name} flag`);
  }

  return value;
}

function readOptionalStringFlag(flags: CliFlags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}
