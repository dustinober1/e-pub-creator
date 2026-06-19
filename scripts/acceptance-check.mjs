import { execFileSync } from "node:child_process";

const commands = [
  ["pnpm", ["test"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["--filter", "@epub-creator/web", "build"]],
];

for (const [command, args] of commands) {
  process.stdout.write(`Running ${command} ${args.join(" ")}\n`);
  execFileSync(command, args, { stdio: "inherit" });
}

process.stdout.write("Acceptance checks passed.\n");
