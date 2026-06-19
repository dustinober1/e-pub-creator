import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createNodeServer } from "../src/node-server";
import type { ServerApp } from "../src/server";

const openServers: ReturnType<typeof createNodeServer>[] = [];

afterEach(async () => {
  await Promise.all(
    openServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error === undefined) {
              resolve();
            } else {
              reject(error);
            }
          });
        })
    )
  );
});

describe("node server adapter", () => {
  it("serves health JSON over HTTP", async () => {
    const server = await listenOnEphemeralPort(createNodeServer());
    const response = await fetch(serverUrl(server, "/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("converts handler errors into JSON 500 responses", async () => {
    const throwingApp: ServerApp = {
      async handle() {
        throw new Error("boom");
      }
    };
    const server = await listenOnEphemeralPort(createNodeServer(throwingApp));
    const response = await fetch(serverUrl(server, "/api/health"));

    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
  });

  it("closes cleanly when response streaming fails after headers are sent", async () => {
    const streamingFailureApp: ServerApp = {
      async handle() {
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error("stream failed"));
            }
          })
        );
      }
    };
    const server = await listenOnEphemeralPort(createNodeServer(streamingFailureApp));

    await expect(fetch(serverUrl(server, "/api/health"))).rejects.toThrow();
  });

  it("does not send a body for HEAD health requests", async () => {
    const server = await listenOnEphemeralPort(createNodeServer());
    const response = await fetch(serverUrl(server, "/api/health"), { method: "HEAD" });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.text()).toBe("");
  });
});

async function listenOnEphemeralPort(
  server: ReturnType<typeof createNodeServer>
): Promise<ReturnType<typeof createNodeServer>> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      openServers.push(server);
      resolve();
    });
  });

  return server;
}

function serverUrl(server: ReturnType<typeof createNodeServer>, path: string): string {
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}${path}`;
}
