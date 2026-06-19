import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BookProject } from "./book";
import { createManifest } from "./manifest";

export async function writeProjectFolder(directory: string, project: BookProject): Promise<void> {
  await mkdir(join(directory, "content"), { recursive: true });
  await mkdir(join(directory, "assets"), { recursive: true });
  await mkdir(join(directory, "themes"), { recursive: true });
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify(createManifest(project), null, 2)}\n`);
  await writeFile(join(directory, "content", "book.json"), `${JSON.stringify(project, null, 2)}\n`);
}

export async function readProjectFolder(directory: string): Promise<BookProject> {
  const raw = await readFile(join(directory, "content", "book.json"), "utf8");
  const project = JSON.parse(raw) as BookProject;

  if (project.formatVersion !== 1) {
    throw new Error(`Unsupported project format version: ${String(project.formatVersion)}`);
  }

  return project;
}
