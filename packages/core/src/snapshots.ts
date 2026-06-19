import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BookProject } from "./book";

export interface ProjectSnapshot {
  id: string;
  reason: "before-import" | "before-reimport" | "before-theme-change" | "before-frontmatter-regeneration" | "before-export";
  path: string;
  createdAt: string;
}

export async function createSnapshot(
  directory: string,
  project: BookProject,
  reason: ProjectSnapshot["reason"]
): Promise<ProjectSnapshot> {
  const createdAt = new Date().toISOString();
  const safeStamp = createdAt.replaceAll(":", "-").replaceAll(".", "-");
  const filename = `${safeStamp}-${reason}.json`;
  const snapshotDirectory = join(directory, ".snapshots");
  const snapshotPath = join(snapshotDirectory, filename);

  await mkdir(snapshotDirectory, { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(project, null, 2)}\n`);

  return {
    id: filename.replace(/\.json$/, ""),
    reason,
    path: snapshotPath,
    createdAt
  };
}
