import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { BookProject } from "./book";
import { createManifest, PROJECT_FOLDER_PATHS, type ProjectManifest } from "./manifest";
import { assertBundleLocalPath } from "./paths";

export async function writeProjectFolder(directory: string, project: BookProject): Promise<void> {
  await mkdir(join(directory, PROJECT_FOLDER_PATHS.contentDirectory), { recursive: true });
  await mkdir(join(directory, PROJECT_FOLDER_PATHS.assets), { recursive: true });
  await mkdir(join(directory, PROJECT_FOLDER_PATHS.themes), { recursive: true });
  await mkdir(join(directory, PROJECT_FOLDER_PATHS.snapshots), { recursive: true });
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify(createManifest(project), null, 2)}\n`);
  await writeFile(join(directory, PROJECT_FOLDER_PATHS.content), `${JSON.stringify(project, null, 2)}\n`);
}

export async function copyProjectAssetSources(directory: string, project: BookProject): Promise<void> {
  for (const asset of project.assets) {
    if (!asset.source) {
      continue;
    }

    assertBundleLocalPath(asset.projectPath, "asset projectPath");
    const destination = join(directory, asset.projectPath);

    await mkdir(dirname(destination), { recursive: true });
    await copyFile(asset.source.path, destination);
  }
}

export async function readProjectFolder(directory: string): Promise<BookProject> {
  const manifest = await readManifest(directory);
  const raw = await readFile(join(directory, manifest.contentPath), "utf8");
  const project = JSON.parse(raw) as unknown;

  assertBookProject(project);

  if (manifest.projectId !== project.id) {
    throw new Error(`Project manifest ID does not match project content: ${manifest.projectId} != ${project.id}`);
  }

  return project;
}

async function readManifest(directory: string): Promise<ProjectManifest> {
  const raw = await readFile(join(directory, "manifest.json"), "utf8");
  const manifest = JSON.parse(raw) as unknown;

  assertProjectManifest(manifest);

  return manifest;
}

function assertProjectManifest(value: unknown): asserts value is ProjectManifest {
  if (!isRecord(value)) {
    throw new Error("Invalid project manifest: expected a JSON object");
  }

  if (value.app !== "epub-creator") {
    throw new Error(`Invalid project manifest app: ${String(value.app)}`);
  }

  if (value.formatVersion !== 1) {
    throw new Error(`Unsupported project manifest format version: ${String(value.formatVersion)}`);
  }

  assertManifestPath(value, "contentPath", PROJECT_FOLDER_PATHS.content);
  assertManifestPath(value, "assetsPath", PROJECT_FOLDER_PATHS.assets);
  assertManifestPath(value, "themesPath", PROJECT_FOLDER_PATHS.themes);
  assertManifestPath(value, "snapshotsPath", PROJECT_FOLDER_PATHS.snapshots);

  if (typeof value.projectId !== "string" || value.projectId.length === 0) {
    throw new Error(`Invalid project manifest projectId: ${String(value.projectId)}`);
  }
}

function assertManifestPath(
  manifest: Record<string, unknown>,
  field: "contentPath" | "assetsPath" | "themesPath" | "snapshotsPath",
  expected: string
): void {
  if (manifest[field] !== expected) {
    throw new Error(`Invalid project manifest ${field}: ${String(manifest[field])}`);
  }
}

function assertBookProject(value: unknown): asserts value is BookProject {
  if (!isRecord(value)) {
    throw new Error("Invalid project content: expected a JSON object");
  }

  if (value.formatVersion !== 1) {
    throw new Error(`Unsupported project format version: ${String(value.formatVersion)}`);
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`Invalid project content: id must be a string`);
  }

  if (!isRecord(value.metadata)) {
    throw new Error("Invalid project content: metadata must be an object");
  }

  if (typeof value.metadata.title !== "string") {
    throw new Error("Invalid project content: metadata.title must be a string");
  }

  if (!Array.isArray(value.sections)) {
    throw new Error("Invalid project content: sections must be an array");
  }

  if (!Array.isArray(value.assets)) {
    throw new Error("Invalid project content: assets must be an array");
  }

  for (const asset of value.assets) {
    if (!isRecord(asset) || typeof asset.projectPath !== "string") {
      throw new Error("Invalid project content: asset projectPath must be a string");
    }

    assertBundleLocalPath(asset.projectPath, "Invalid project content: asset projectPath");
  }

  if (!isRecord(value.theme)) {
    throw new Error("Invalid project content: theme must be an object");
  }

  if (typeof value.createdAt !== "string") {
    throw new Error("Invalid project content: createdAt must be a string");
  }

  if (typeof value.updatedAt !== "string") {
    throw new Error("Invalid project content: updatedAt must be a string");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
