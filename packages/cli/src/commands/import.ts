import { readFile } from "node:fs/promises";
import { writeProjectFolder } from "@epub-creator/core";
import { importMarkdown } from "@epub-creator/importers";
import { readOptionalStringFlag, readRequiredStringFlag, type CliFlags } from "../flags";
import { resolveCliPath } from "../paths";

export async function importCommand(flags: CliFlags): Promise<string> {
  const source = resolveCliPath(readRequiredStringFlag(flags, "source"));
  const projectPath = resolveCliPath(readRequiredStringFlag(flags, "project"));
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
