import type { ParsedArgs } from "./parse-args";

export type CliFlags = ParsedArgs["flags"];

export function readRequiredStringFlag(flags: CliFlags, name: string): string {
  const value = readOptionalStringFlag(flags, name);

  if (!value) {
    throw new Error(`Missing required --${name} flag`);
  }

  return value;
}

export function readOptionalStringFlag(flags: CliFlags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}
