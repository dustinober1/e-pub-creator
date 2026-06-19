import { readProjectFolder } from "@epub-creator/core";
import { validateAccessibility } from "@epub-creator/validation";
import type { ParsedArgs } from "../parse-args";

type CliFlags = ParsedArgs["flags"];

export async function validateCommand(flags: CliFlags): Promise<string> {
  const projectPath = readRequiredStringFlag(flags, "project");
  const project = await readProjectFolder(projectPath);
  return JSON.stringify(validateAccessibility(project), null, 2);
}

function readRequiredStringFlag(flags: CliFlags, name: string): string {
  const value = flags[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required --${name} flag`);
  }

  return value;
}
