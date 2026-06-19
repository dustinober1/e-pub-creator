import { copyProjectAssetSources, writeProjectFolder } from "@epub-creator/core";
import { importDocx, importDocxBuffer, importMarkdown } from "@epub-creator/importers";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const DOCX_UPLOAD_SIZE_LIMIT = 25 * 1024 * 1024;

export function projectsRoute(): Response {
  return Response.json({ openProject: null, recentProjects: [] });
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
    await writeProjectFolder(project, imported.project);
    await copyProjectAssetSources(project, imported.project);

    return Response.json({
      source,
      project,
      status: "imported",
      title: imported.project.metadata.title,
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
      await writeProjectFolder(projectPath, imported.project);
      await copyProjectAssetSources(projectPath, imported.project);
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
