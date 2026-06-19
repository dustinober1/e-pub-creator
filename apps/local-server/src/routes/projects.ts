import { writeProjectFolder } from "@epub-creator/core";
import { importDocx, importMarkdown } from "@epub-creator/importers";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

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
