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

  return Response.json({
    source,
    project,
    status: "accepted"
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
