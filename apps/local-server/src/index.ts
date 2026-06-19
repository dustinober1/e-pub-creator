import { pathToFileURL } from "node:url";
import { createNodeServer } from "./node-server";

const host = "127.0.0.1";
const port = 4174;

if (isMainModule()) {
  const server = createNodeServer();

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Local server port ${port} is already in use.`);
      process.exitCode = 1;
      return;
    }

    throw error;
  });

  server.listen(port, host, () => {
    console.log(`Local server listening on http://${host}:${port}`);
  });
}

function isMainModule(): boolean {
  return process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
}
