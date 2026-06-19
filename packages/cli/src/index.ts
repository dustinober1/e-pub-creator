#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { exportCommand } from "./commands/export";
import { importCommand } from "./commands/import";
import { themesCommand } from "./commands/themes";
import { validateCommand } from "./commands/validate";
import { parseArgs } from "./parse-args";

export async function runCli(argv = process.argv.slice(2)): Promise<string> {
  const { command, flags } = parseArgs(argv);

  if (command === "import") {
    return importCommand(flags);
  }

  if (command === "validate") {
    return validateCommand(flags);
  }

  if (command === "export") {
    return exportCommand(flags);
  }

  if (command === "themes") {
    return themesCommand();
  }

  return usageText();
}

function usageText(): string {
  return [
    "Usage: epub-creator <command> [flags]",
    "",
    "Commands:",
    "  import --source <book.md> --project <folder>",
    "  validate --project <folder>",
    "  export --project <folder> [--profile <profile>]",
    "  themes"
  ].join("\n");
}

function isExecutableEntrypoint(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

if (isExecutableEntrypoint()) {
  runCli()
    .then((output) => {
      process.stdout.write(`${output}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
