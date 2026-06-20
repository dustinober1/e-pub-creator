import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBookProject } from "../src/book";
import { createSnapshot, listSnapshots, readSnapshot } from "../src/snapshots";

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

  it("lists and reads created snapshots", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
    const project = createBookProject({ title: "Snapshot Book", author: "A. Writer", language: "en" });

    const snapshot = await createSnapshot(directory, project, "before-export");
    const snapshots = await listSnapshots(directory);
    const restored = await readSnapshot(directory, snapshot.id);

    expect(snapshots).toEqual([
      expect.objectContaining({
        id: snapshot.id,
        reason: "before-export"
      })
    ]);
    expect(restored.metadata.title).toBe("Snapshot Book");
  });

  it("rejects unsafe snapshot ids", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));

    await expect(readSnapshot(directory, "../book")).rejects.toThrow(
      "Invalid snapshot id"
    );
  });
});
