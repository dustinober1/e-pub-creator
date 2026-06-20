import { useEffect, useRef, useState } from "react";
import type { BookProject } from "@epub-creator/core/book";
import {
  listProjectSnapshots,
  restoreProjectSnapshot,
  type ProjectSnapshotSummary
} from "../api/client";

interface VersionHistoryPanelProps {
  projectPath: string;
  onRestore: (project: BookProject) => void;
}

export function VersionHistoryPanel({
  projectPath,
  onRestore
}: VersionHistoryPanelProps) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshotSummary[]>([]);
  const [status, setStatus] = useState("");
  const requestVersionRef = useRef(0);
  const projectPathRef = useRef(projectPath);

  useEffect(() => {
    requestVersionRef.current += 1;
    projectPathRef.current = projectPath;
    setSnapshots([]);
    setStatus("");
  }, [projectPath]);

  async function refresh(): Promise<void> {
    const trimmedProjectPath = projectPath.trim();

    if (!trimmedProjectPath) {
      setStatus("Project folder is required.");
      return;
    }

    setStatus("Loading...");
    const requestVersion = requestVersionRef.current;

    try {
      const result = await listProjectSnapshots(trimmedProjectPath);
      if (
        requestVersion !== requestVersionRef.current ||
        trimmedProjectPath !== projectPathRef.current.trim()
      ) {
        return;
      }

      setSnapshots(result.snapshots);
      setStatus(`${result.snapshots.length} versions found.`);
    } catch (error) {
      if (
        requestVersion !== requestVersionRef.current ||
        trimmedProjectPath !== projectPathRef.current.trim()
      ) {
        return;
      }

      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function restore(snapshotId: string): Promise<void> {
    const trimmedProjectPath = projectPath.trim();
    const requestVersion = requestVersionRef.current;

    try {
      const result = await restoreProjectSnapshot(trimmedProjectPath, snapshotId);
      if (
        requestVersion !== requestVersionRef.current ||
        trimmedProjectPath !== projectPathRef.current.trim()
      ) {
        return;
      }

      onRestore(result.bookProject);
      setStatus("Version restored.");
    } catch (error) {
      if (
        requestVersion !== requestVersionRef.current ||
        trimmedProjectPath !== projectPathRef.current.trim()
      ) {
        return;
      }

      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="panel version-history-panel" aria-labelledby="version-history-heading">
      <h2 id="version-history-heading">Version History</h2>
      <div className="button-row">
        <button type="button" onClick={() => void refresh()}>
          Refresh Versions
        </button>
      </div>
      {status ? <p className="import-status">{status}</p> : null}
      {snapshots.length > 0 ? (
        <ol className="version-list" aria-label="Version history">
          {snapshots.map((snapshot) => (
            <li key={snapshot.id} className="version-list-item">
              <div className="version-list-copy">
                <span className="version-list-date">{snapshot.createdAt}</span>
                <span className="version-list-reason">{snapshot.reason}</span>
              </div>
              <button type="button" onClick={() => void restore(snapshot.id)}>
                Restore
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
