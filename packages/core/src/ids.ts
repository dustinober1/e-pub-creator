export type EntityPrefix =
  | "book"
  | "section"
  | "block"
  | "asset"
  | "publication"
  | "theme"
  | "snapshot"
  | "report";

export function createId(prefix: EntityPrefix): string {
  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${prefix}_${stamp}_${random}`;
}
