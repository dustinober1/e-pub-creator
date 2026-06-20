import {
  assertBookProject,
  copyProjectAssetSources,
  createSnapshot,
  listSnapshots,
  readProjectFolder,
  readSnapshot,
  type BookProject,
  writeProjectFolder
} from "@epub-creator/core";
import { createEpubPackage, writeEpubFile } from "@epub-creator/epub";
import { importDocx, importDocxBuffer, importMarkdown } from "@epub-creator/importers";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const DOCX_UPLOAD_SIZE_LIMIT = 25 * 1024 * 1024;
const EXPORT_CSS = "body { line-height: 1.55; }";
type ExportProfile = "portable-epub3" | "kdp-safe" | "apple-books-enhanced";

export function projectsRoute(): Response {
  return Response.json({ openProject: null, recentProjects: [] });
}

export async function snapshotsRoute(request: Request): Promise<Response> {
  const project = new URL(request.url).searchParams.get("project")?.trim();

  if (!project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  try {
    return Response.json({ snapshots: await listSnapshots(project) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Snapshot list failed: ${message}` }, { status: 400 });
  }
}

export async function restoreSnapshotRoute(request: Request): Promise<Response> {
  const body = await readJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  if (typeof body.project !== "string" || !body.project.trim()) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  if (typeof body.snapshotId !== "string" || !body.snapshotId.trim()) {
    return Response.json({ error: "--snapshotId is required." }, { status: 400 });
  }

  const project = body.project.trim();

  try {
    const current = await readProjectFolder(project);
    const restored = await readSnapshot(project, body.snapshotId.trim());
    const rollbackSnapshot = await createSnapshot(project, current, "before-restore");
    await writeProjectFolder(project, restored);

    try {
      await copyProjectAssetSources(project, restored);
    } catch (error) {
      const rollbackProject = await readSnapshot(project, rollbackSnapshot.id);
      await writeProjectFolder(project, rollbackProject);
      await copyProjectAssetSources(project, rollbackProject);
      throw error;
    }

    return Response.json({
      status: "restored",
      project,
      bookProject: restored
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Snapshot restore failed: ${message}` }, { status: 400 });
  }
}

export async function importProjectRoute(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: "Request body must be an object." }, { status: 400 });
  }

  if (body.source !== undefined && typeof body.source !== "string") {
    return Response.json({ error: "--source must be a string." }, { status: 400 });
  }

  if (body.project !== undefined && typeof body.project !== "string") {
    return Response.json({ error: "--project must be a string." }, { status: 400 });
  }

  const source = body.source?.trim();
  const project = body.project?.trim();

  if (!source) {
    return Response.json({ error: "--source is required." }, { status: 400 });
  }

  if (!project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  try {
    const imported = await importSource(source);
    const existingProject = await readPersistedProject(project);

    if (existingProject) {
      await createSnapshot(project, existingProject, "before-reimport");
    }

    await writeProjectFolder(project, imported.project);
    await copyProjectAssetSources(project, imported.project);

    if (!existingProject) {
      await createSnapshot(project, imported.project, "before-import");
    }

    return Response.json({
      source,
      project,
      status: "imported",
      title: imported.project.metadata.title,
      bookProject: imported.project,
      sectionCount: imported.project.sections.length,
      warningCount: imported.report.warnings.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Import failed: ${message}` }, { status: 400 });
  }
}

export async function importProjectUploadRoute(request: Request): Promise<Response> {
  const contentLength = parseContentLength(request.headers.get("content-length"));

  if (contentLength !== undefined && contentLength > DOCX_UPLOAD_SIZE_LIMIT) {
    return Response.json({ error: "DOCX upload is too large." }, { status: 413 });
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "DOCX file is required." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    return Response.json({ error: "Only .docx uploads are supported." }, { status: 400 });
  }

  if (file.size > DOCX_UPLOAD_SIZE_LIMIT) {
    return Response.json({ error: "DOCX upload is too large." }, { status: 413 });
  }

  const projectPath = readOptionalFormString(form, "project");
  const author = readOptionalFormString(form, "author");
  const language = readOptionalFormString(form, "language");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const imported = await importDocxBuffer(buffer, {
      sourcePath: file.name,
      author: author ?? "Unknown Author",
      language: language ?? "en"
    });

    if (projectPath) {
      const existingProject = await readPersistedProject(projectPath);

      if (existingProject) {
        await createSnapshot(projectPath, existingProject, "before-reimport");
      }

      await writeProjectFolder(projectPath, imported.project);
      await copyProjectAssetSources(projectPath, imported.project);

      if (!existingProject) {
        await createSnapshot(projectPath, imported.project, "before-import");
      }
    }

    return Response.json({
      source: file.name,
      project: projectPath,
      status: "imported",
      title: imported.project.metadata.title,
      sectionCount: imported.project.sections.length,
      warningCount: imported.report.warnings.length,
      bookProject: imported.project,
      report: imported.report
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Import failed: ${message}` }, { status: 400 });
  }
}

export async function saveProjectRoute(request: Request): Promise<Response> {
  const body = await readJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  if (typeof body.project !== "string") {
    return Response.json({ error: "--project must be a string." }, { status: 400 });
  }

  const project = body.project.trim();

  if (!project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  if (!isRecord(body.bookProject)) {
    return Response.json({ error: "--bookProject must be an object." }, { status: 400 });
  }

  const bookProject = body.bookProject as unknown as BookProject;

  try {
    assertBookProject(bookProject);
    await writeProjectFolder(project, bookProject);
    await copyProjectAssetSources(project, bookProject);

    return Response.json({ status: "saved", project });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Invalid project content:") || message.startsWith("Unsupported project format version:")) {
      return Response.json({ error: "--bookProject is invalid." }, { status: 400 });
    }

    return Response.json({ error: `Save failed: ${message}` }, { status: 400 });
  }
}

export async function exportProjectRoute(request: Request): Promise<Response> {
  const body = await readJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  if (typeof body.project !== "string") {
    return Response.json({ error: "--project must be a string." }, { status: 400 });
  }

  if (typeof body.output !== "string") {
    return Response.json({ error: "--output must be a string." }, { status: 400 });
  }

  const project = body.project.trim();
  const output = body.output.trim();

  if (!project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  if (!output) {
    return Response.json({ error: "--output is required." }, { status: 400 });
  }

  if (!isExportProfile(body.profile)) {
    return Response.json({ error: "--profile must be a supported export profile." }, { status: 400 });
  }

  if (!isRecord(body.bookProject)) {
    return Response.json({ error: "--bookProject must be an object." }, { status: 400 });
  }

  const bookProject = body.bookProject as unknown as BookProject;

  try {
    assertBookProject(bookProject);
    await writeProjectFolder(project, bookProject);
    await copyProjectAssetSources(project, bookProject);
    await createSnapshot(project, bookProject, "before-export");

    const packageResult = createEpubPackage(bookProject, EXPORT_CSS, body.profile);
    await writeEpubFile({
      projectDirectory: project,
      outputPath: output,
      packageResult
    });

    return Response.json({
      status: "exported",
      project,
      outputPath: output,
      issueCount: packageResult.report.issues.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("Invalid project content:") || message.startsWith("Unsupported project format version:")) {
      return Response.json({ error: "--bookProject is invalid." }, { status: 400 });
    }

    return Response.json({ error: `Export failed: ${message}` }, { status: 400 });
  }
}

async function importSource(source: string) {
  const extension = extname(source).toLowerCase();

  if (extension === ".md" || extension === ".markdown") {
    const markdown = await readFile(source, "utf8");
    return importMarkdown(markdown, {
      sourcePath: source,
      author: "Unknown Author",
      language: "en"
    });
  }

  if (extension === ".docx") {
    return importDocx(source, {
      sourcePath: source,
      author: "Unknown Author",
      language: "en"
    });
  }

  throw new Error(`Unsupported import source type: ${extension || "unknown"}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return Response.json({ error: "Request body must be an object." }, { status: 400 });
  }

  return body;
}

function isExportProfile(value: unknown): value is ExportProfile {
  return value === "portable-epub3" || value === "kdp-safe" || value === "apple-books-enhanced";
}

function readOptionalFormString(form: FormData, key: string): string | undefined {
  const value = form.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseContentLength(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

async function readPersistedProject(projectPath: string): Promise<BookProject | undefined> {
  try {
    return await readProjectFolder(projectPath);
  } catch {
    return undefined;
  }
}
