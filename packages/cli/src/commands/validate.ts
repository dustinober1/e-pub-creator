import { readProjectFolder } from "@epub-creator/core";
import { validateAccessibility } from "@epub-creator/validation";
import { readRequiredStringFlag, type CliFlags } from "../flags";
import { resolveCliPath } from "../paths";

export async function validateCommand(flags: CliFlags): Promise<string> {
  const projectPath = resolveCliPath(readRequiredStringFlag(flags, "project"));
  const project = await readProjectFolder(projectPath);
  return JSON.stringify(validateAccessibility(project), null, 2);
}
