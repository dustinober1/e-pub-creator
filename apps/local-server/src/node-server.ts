import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { createServerApp } from "./server";
import type { ServerApp } from "./server";

const fallbackHost = "127.0.0.1";
const fallbackPort = 4174;

type NodeRequestInit = RequestInit & {
  body?: IncomingMessage;
  duplex?: "half";
};

export function createNodeServer(app: ServerApp = createServerApp()): ReturnType<typeof createServer> {
  return createServer(async (request, response) => {
    const fetchRequest = toFetchRequest(request);
    const fetchResponse = await handleRequest(app, fetchRequest);

    await sendFetchResponse(fetchResponse, response, request.method ?? "GET");
  });
}

function toFetchRequest(request: IncomingMessage): Request {
  const headers = toHeaders(request);
  const url = new URL(request.url ?? "/", `http://${headers.get("host") ?? `${fallbackHost}:${fallbackPort}`}`);
  const method = request.method ?? "GET";

  if (method === "GET" || method === "HEAD") {
    return new Request(url, { headers, method });
  }

  return new Request(url, {
    body: request,
    duplex: "half",
    headers,
    method
  } as NodeRequestInit);
}

function toHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  return headers;
}

async function handleRequest(app: ServerApp, request: Request): Promise<Response> {
  try {
    return await app.handle(request);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendFetchResponse(
  fetchResponse: Response,
  serverResponse: ServerResponse,
  requestMethod: string
): Promise<void> {
  fetchResponse.headers.forEach((value, name) => {
    serverResponse.setHeader(name, value);
  });

  serverResponse.writeHead(fetchResponse.status, fetchResponse.statusText);

  const body = fetchResponse.body;

  if (requestMethod === "HEAD" || body === null) {
    serverResponse.end();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const nodeBody = Readable.fromWeb(body);

    nodeBody.once("error", reject);
    serverResponse.once("error", reject);
    serverResponse.once("finish", resolve);
    nodeBody.pipe(serverResponse);
  });
}
