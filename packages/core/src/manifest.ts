import type { BookProject } from "./book";

export interface ProjectManifest {
  formatVersion: 1;
  app: "epub-creator";
  projectId: string;
  title: string;
  contentPath: "content/book.json";
  assetsPath: "assets";
  themesPath: "themes";
  snapshotsPath: ".snapshots";
  updatedAt: string;
}

export function createManifest(project: BookProject): ProjectManifest {
  return {
    formatVersion: 1,
    app: "epub-creator",
    projectId: project.id,
    title: project.metadata.title,
    contentPath: "content/book.json",
    assetsPath: "assets",
    themesPath: "themes",
    snapshotsPath: ".snapshots",
    updatedAt: project.updatedAt
  };
}
