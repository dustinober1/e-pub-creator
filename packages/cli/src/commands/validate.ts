import { readProjectFolder } from "@epub-creator/core";
import { validateAccessibility } from "@epub-creator/validation";
import { readRequiredStringFlag, type CliFlags } from "../flags";

export async function validateCommand(flags: CliFlags): Promise<string> {
  const projectPath = readRequiredStringFlag(flags, "project");
  const project = await readProjectFolder(projectPath);
  return JSON.stringify(validateAccessibility(project), null, 2);
}
