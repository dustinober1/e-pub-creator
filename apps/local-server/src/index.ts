import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerApp } from "./server";

const host = "127.0.0.1";
const port = 4174;

const app = createServerApp();

const server = createServer(async (request, response) => {
  try {
    const fetchRequest = await toFetchRequest(request);
    const fetchResponse = await app.handle(fetchRequest);
    await sendFetchResponse(fetchResponse, response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      response.writeHead(500, { "content-type": "application/json" });
    }
    response.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(port, host, () => {
  console.log(`Local server listening on http://${host}:${port}`);
});

async function toFetchRequest(request: IncomingMessage): Promise<Request> {
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

  const url = new URL(request.url ?? "/", `http://${headers.get("host") ?? `${host}:${port}`}`);
  const method = request.method ?? "GET";

  if (method === "GET" || method === "HEAD") {
    return new Request(url, { headers, method });
  }

  return new Request(url, {
    body: await readBody(request),
    headers,
    method
  });
}

async function readBody(request: IncomingMessage): Promise<Uint8Array> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function sendFetchResponse(response: Response, serverResponse: ServerResponse): Promise<void> {
  response.headers.forEach((value, name) => {
    serverResponse.setHeader(name, value);
  });

  serverResponse.writeHead(response.status, response.statusText);

  if (response.body === null) {
    serverResponse.end();
    return;
  }

  serverResponse.end(Buffer.from(await response.arrayBuffer()));
}
