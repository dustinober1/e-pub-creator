import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BookProject } from "./book";
import { createId } from "./ids";
import { PROJECT_FOLDER_PATHS } from "./manifest";
import { assertBookProject } from "./project-folder";

const SNAPSHOT_ID_PATTERN = /^[A-Za-z0-9._-]+$/;
const SNAPSHOT_REASONS = [
  "before-import",
  "before-reimport",
  "before-theme-change",
  "before-frontmatter-regeneration",
  "before-export",
  "before-restore"
] as const;

export interface ProjectSnapshot {
  id: string;
  reason:
    | "before-import"
    | "before-reimport"
    | "before-theme-change"
    | "before-frontmatter-regeneration"
    | "before-export"
    | "before-restore";
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
  const filename = `${safeStamp}-${reason}-${createId("snapshot")}.json`;
  const snapshotDirectory = join(directory, PROJECT_FOLDER_PATHS.snapshots);
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

export async function listSnapshots(directory: string): Promise<ProjectSnapshot[]> {
  const snapshotDirectory = join(directory, PROJECT_FOLDER_PATHS.snapshots);
  const entries = await readdir(snapshotDirectory).catch(() => []);

  return entries
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => {
      const id = entry.replace(/\.json$/, "");

      return {
        id,
        reason: readReasonFromSnapshotId(id),
        path: join(snapshotDirectory, entry),
        createdAt: readCreatedAtFromSnapshotId(id)
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function readSnapshot(
  directory: string,
  snapshotId: string
): Promise<BookProject> {
  if (!SNAPSHOT_ID_PATTERN.test(snapshotId)) {
    throw new Error("Invalid snapshot id.");
  }

  const raw = await readFile(
    join(directory, PROJECT_FOLDER_PATHS.snapshots, `${snapshotId}.json`),
    "utf8"
  );
  const project = JSON.parse(raw) as unknown;

  assertBookProject(project);

  return project;
}

function readCreatedAtFromSnapshotId(snapshotId: string): string {
  const stamp = snapshotId.split("-before-")[0] ?? snapshotId;

  return stamp.replace(
    /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z).*$/,
    "$1:$2:$3.$4"
  );
}

function readReasonFromSnapshotId(snapshotId: string): ProjectSnapshot["reason"] {
  const matchedReason = SNAPSHOT_REASONS.find((reason) =>
    snapshotId.includes(`-${reason}-`)
  );

  return matchedReason ?? "before-export";
}
