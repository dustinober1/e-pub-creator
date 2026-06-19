import { healthRoute } from "./routes/health";
import { projectsRoute } from "./routes/projects";
import { themesRoute } from "./routes/themes";

export interface ServerApp {
  handle(request: Request): Promise<Response>;
}

export function createServerApp(): ServerApp {
  return {
    async handle(request: Request): Promise<Response> {
      const { pathname } = new URL(request.url);

      if (pathname === "/api/health") {
        return healthRoute();
      }

      if (pathname === "/api/themes") {
        return themesRoute();
      }

      if (pathname === "/api/projects") {
        return projectsRoute();
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    }
  };
}
