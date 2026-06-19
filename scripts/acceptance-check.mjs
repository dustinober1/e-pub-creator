import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

if (!existsSync("LICENSE") || !readFileSync("LICENSE", "utf8").includes("Apache License")) {
  throw new Error("Expected root Apache-2.0 LICENSE file.");
}

const commands = [
  [pnpmCommand, ["test"]],
  [pnpmCommand, ["typecheck"]],
  [pnpmCommand, ["--filter", "@epub-creator/web", "build"]],
];

for (const [command, args] of commands) {
  process.stdout.write(`Running ${command} ${args.join(" ")}\n`);
  execFileSync(command, args, { stdio: "inherit" });
}

const tempDirectory = mkdtempSync(join(tmpdir(), "epub-creator-acceptance-"));
const outputPath = join(tempDirectory, "formatting-stress.epub");

try {
  execFileSync(
    pnpmCommand,
    [
      "--filter",
      "@epub-creator/cli",
      "cli",
      "validate",
      "--project",
      "fixtures/projects/formatting-stress",
    ],
    { stdio: "inherit" },
  );
  execFileSync(
    pnpmCommand,
    [
      "--filter",
      "@epub-creator/cli",
      "cli",
      "export",
      "--project",
      "fixtures/projects/formatting-stress",
      "--profile",
      "kdp-safe",
      "--output",
      outputPath,
    ],
    { stdio: "inherit" },
  );

  if (!existsSync(outputPath)) {
    throw new Error(`Expected EPUB export to exist: ${outputPath}`);
  }

  const archive = readFileSync(outputPath);
  const archiveText = archive.toString("latin1");

  if (!archiveText.includes("mimetype") || !archiveText.includes("EPUB/package.opf")) {
    throw new Error("Expected EPUB export to contain package files.");
  }
} finally {
  rmSync(tempDirectory, { recursive: true, force: true });
}

process.stdout.write("Acceptance checks passed.\n");
