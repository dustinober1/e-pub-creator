import { healthRoute } from "./routes/health";
import {
  exportProjectRoute,
  importProjectRoute,
  importProjectUploadRoute,
  projectsRoute,
  saveProjectRoute
} from "./routes/projects";
import { themesRoute } from "./routes/themes";

export interface ServerApp {
  handle(request: Request): Promise<Response>;
}

export function createServerApp(): ServerApp {
  return {
    async handle(request: Request): Promise<Response> {
      const { pathname } = new URL(request.url);

      if (pathname === "/api/health") {
        if (!isReadOnlyMethod(request.method)) {
          return methodNotAllowed();
        }

        return healthRoute();
      }

      if (pathname === "/api/themes") {
        if (!isReadOnlyMethod(request.method)) {
          return methodNotAllowed();
        }

        return themesRoute();
      }

      if (pathname === "/api/projects/import") {
        if (request.method !== "POST") {
          return methodNotAllowed("POST");
        }

        return importProjectRoute(request);
      }

      if (pathname === "/api/projects/import/upload") {
        if (request.method !== "POST") {
          return methodNotAllowed("POST");
        }

        return importProjectUploadRoute(request);
      }

      if (pathname === "/api/projects/save") {
        if (request.method !== "PUT") {
          return methodNotAllowed("PUT");
        }

        return saveProjectRoute(request);
      }

      if (pathname === "/api/projects/export") {
        if (request.method !== "POST") {
          return methodNotAllowed("POST");
        }

        return exportProjectRoute(request);
      }

      if (pathname === "/api/projects") {
        if (!isReadOnlyMethod(request.method)) {
          return methodNotAllowed();
        }

        return projectsRoute();
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    }
  };
}

function isReadOnlyMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

function methodNotAllowed(allow = "GET, HEAD"): Response {
  return Response.json(
    { error: "Method not allowed" },
    {
      headers: { allow },
      status: 405
    }
  );
}
