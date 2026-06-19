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
