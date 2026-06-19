#!/usr/bin/env -S tsx
import { realpathSync } from "node:fs";
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

  if (command === "help") {
    return usageText();
  }

  throw new Error(`Unknown command: ${command}\n${usageText()}`);
}

function usageText(): string {
  return [
    "Usage: epub-creator <command> [flags]",
    "",
    "Commands:",
    "  import --source <book.md> --project <folder>",
    "  validate --project <folder>",
    "  export --project <folder> [--profile <profile>] [--output <book.epub>]",
    "  themes"
  ].join("\n");
}

function isExecutableEntrypoint(): boolean {
  const invokedPath = process.argv[1];

  if (!invokedPath) {
    return false;
  }

  try {
    return realpathSync(invokedPath) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
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
