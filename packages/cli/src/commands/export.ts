import { readProjectFolder } from "@epub-creator/core";
import { createEpubPackage } from "@epub-creator/epub";
import type { ExportProfile } from "@epub-creator/validation";
import type { ParsedArgs } from "../parse-args";

type CliFlags = ParsedArgs["flags"];

const DEFAULT_EXPORT_PROFILE: ExportProfile = "portable-epub3";
const EXPORT_CSS = "body { line-height: 1.55; }";

export async function exportCommand(flags: CliFlags): Promise<string> {
  const projectPath = readRequiredStringFlag(flags, "project");
  const profile = readExportProfile(flags.profile);
  const project = await readProjectFolder(projectPath);
  const result = createEpubPackage(project, EXPORT_CSS, profile);

  return JSON.stringify(
    {
      fileCount: result.files.length,
      assetFileCount: result.assetFiles.length,
      issueCount: result.report.issues.length,
      profile
    },
    null,
    2
  );
}

function readRequiredStringFlag(flags: CliFlags, name: string): string {
  const value = flags[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required --${name} flag`);
  }

  return value;
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
