import type { BookProject } from "@epub-creator/core";

export interface HealthResponse {
  ok: boolean;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}

export interface ImportProjectResponse {
  project: string;
  sectionCount?: number;
  source: string;
  status: string;
  title?: string;
  warningCount?: number;
}

export interface UploadImportReport {
  sourcePath: string;
  warnings: Array<{
    code: string;
    message: string;
  }>;
  importedAssets: Array<{
    sourcePath: string;
    altText: string;
    caption?: string;
  }>;
}

export interface UploadDocxProjectResponse extends ImportProjectResponse {
  bookProject: BookProject;
  report: UploadImportReport;
}

export interface UploadDocxProjectInput {
  file: File;
  project?: string;
  author?: string;
  language?: string;
}

export async function importProject(source: string, project: string): Promise<ImportProjectResponse> {
  const response = await fetch("/api/projects/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source, project })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Import failed: ${response.status}`);
  }

  return response.json() as Promise<ImportProjectResponse>;
}

export async function uploadDocxProject(input: UploadDocxProjectInput): Promise<UploadDocxProjectResponse> {
  const form = new FormData();
  form.set("file", input.file);

  if (input.project?.trim()) {
    form.append("project", input.project);
  }

  if (input.author?.trim()) {
    form.append("author", input.author);
  }

  if (input.language?.trim()) {
    form.append("language", input.language);
  }

  const response = await fetch("/api/projects/import/upload", {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Upload failed: ${response.status}`);
  }

  return response.json() as Promise<UploadDocxProjectResponse>;
}
