import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBookProject } from "../src/book";
import { createSnapshot } from "../src/snapshots";

afterEach(() => {
  vi.useRealTimers();
});

describe("snapshots", () => {
  it("creates timestamped project snapshots for risky operations", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
    const project = createBookProject({ title: "Snapshot Book", author: "A. Writer", language: "en" });

    const snapshot = await createSnapshot(directory, project, "before-import");
    const entries = await readdir(join(directory, ".snapshots"));

    expect(snapshot.reason).toBe("before-import");
    expect(entries[0]).toContain("before-import");
  });

  it("creates unique files for multiple snapshots with the same reason in the same millisecond", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
    const project = createBookProject({ title: "Snapshot Book", author: "A. Writer", language: "en" });

    const first = await createSnapshot(directory, project, "before-import");
    const second = await createSnapshot(directory, project, "before-import");
    const entries = await readdir(join(directory, ".snapshots"));

    expect(first.path).not.toBe(second.path);
    expect(entries).toHaveLength(2);
  });

  it("writes the project content into the snapshot file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
    const project = createBookProject({ title: "Snapshot Book", author: "A. Writer", language: "en" });

    const snapshot = await createSnapshot(directory, project, "before-export");
    const content = JSON.parse(await readFile(snapshot.path, "utf8"));

    expect(content.metadata.title).toBe("Snapshot Book");
  });
});
