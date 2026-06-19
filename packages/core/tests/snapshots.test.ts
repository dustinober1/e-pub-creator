import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBookProject } from "../src/book";
import { createSnapshot } from "../src/snapshots";

describe("snapshots", () => {
  it("creates timestamped project snapshots for risky operations", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
    const project = createBookProject({ title: "Snapshot Book", author: "A. Writer", language: "en" });

    const snapshot = await createSnapshot(directory, project, "before-import");
    const entries = await readdir(join(directory, ".snapshots"));

    expect(snapshot.reason).toBe("before-import");
    expect(entries[0]).toContain("before-import");
  });
});
