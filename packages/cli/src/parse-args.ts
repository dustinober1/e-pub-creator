export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [first, ...rest] = argv;
  const command = first?.startsWith("--") || first === undefined ? "help" : first;
  const tokens = command === "help" && first?.startsWith("--") ? argv : rest;
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token?.startsWith("--")) {
      continue;
    }

    const rawFlag = token.slice(2);
    const separatorIndex = rawFlag.indexOf("=");

    if (separatorIndex !== -1) {
      flags[rawFlag.slice(0, separatorIndex)] = rawFlag.slice(separatorIndex + 1);
      continue;
    }

    const name = rawFlag;
    const next = tokens[index + 1];

    if (next === undefined || next.startsWith("--")) {
      flags[name] = true;
      continue;
    }

    flags[name] = next;
    index += 1;
  }

  return { command, flags };
}
