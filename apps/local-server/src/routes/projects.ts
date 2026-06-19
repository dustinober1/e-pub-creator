export function projectsRoute(): Response {
  return Response.json({ openProject: null, recentProjects: [] });
}

export async function importProjectRoute(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { source?: string; project?: string };

  if (!body.source) {
    return Response.json({ error: "--source is required." }, { status: 400 });
  }

  if (!body.project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  return Response.json({
    source: body.source,
    project: body.project,
    status: "accepted"
  });
}
