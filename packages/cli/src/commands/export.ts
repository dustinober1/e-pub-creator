import { readProjectFolder } from "@epub-creator/core";
import { createEpubPackage, writeEpubFile } from "@epub-creator/epub";
import type { ExportProfile } from "@epub-creator/validation";
import { readOptionalStringFlag, readRequiredStringFlag, type CliFlags } from "../flags";
import { resolveCliPath } from "../paths";

const DEFAULT_EXPORT_PROFILE: ExportProfile = "portable-epub3";
const EXPORT_CSS = "body { line-height: 1.55; }";

export async function exportCommand(flags: CliFlags): Promise<string> {
  const projectPath = resolveCliPath(readRequiredStringFlag(flags, "project"));
  const outputFlag = readOptionalStringFlag(flags, "output");
  const outputPath = outputFlag ? resolveCliPath(outputFlag) : undefined;
  const profile = readExportProfile(flags.profile);
  const project = await readProjectFolder(projectPath);
  const result = createEpubPackage(project, EXPORT_CSS, profile);

  if (outputPath) {
    await writeEpubFile({ projectDirectory: projectPath, outputPath, packageResult: result });
  }

  return JSON.stringify(
    {
      fileCount: result.files.length,
      assetFileCount: result.assetFiles.length,
      issueCount: result.report.issues.length,
      outputPath,
      profile
    },
    null,
    2
  );
}

function readExportProfile(value: string | boolean | undefined): ExportProfile {
  if (value === undefined || value === true) {
    return DEFAULT_EXPORT_PROFILE;
  }

  if (value === "portable-epub3" || value === "kdp-safe" || value === "apple-books-enhanced") {
    return value;
  }

  throw new Error(`Unsupported export profile: ${String(value)}`);
}
