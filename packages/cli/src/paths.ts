import { isAbsolute, resolve } from "node:path";

export function resolveCliPath(pathValue: string): string {
  if (isAbsolute(pathValue)) {
    return pathValue;
  }

  return resolve(process.env.INIT_CWD ?? process.cwd(), pathValue);
}
