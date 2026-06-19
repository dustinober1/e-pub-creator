import { execFileSync } from "node:child_process";

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const commands = [
  [pnpmCommand, ["test"]],
  [pnpmCommand, ["typecheck"]],
  [pnpmCommand, ["--filter", "@epub-creator/web", "build"]],
];

for (const [command, args] of commands) {
  process.stdout.write(`Running ${command} ${args.join(" ")}\n`);
  execFileSync(command, args, { stdio: "inherit" });
}

process.stdout.write("Acceptance checks passed.\n");
