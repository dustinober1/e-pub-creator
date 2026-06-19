import type { BookProject } from "./book";

export const PROJECT_FOLDER_PATHS = {
  contentDirectory: "content",
  content: "content/book.json",
  assets: "assets",
  themes: "themes",
  snapshots: ".snapshots"
} as const;

export interface ProjectManifest {
  formatVersion: 1;
  app: "epub-creator";
  projectId: string;
  title: string;
  contentPath: typeof PROJECT_FOLDER_PATHS.content;
  assetsPath: typeof PROJECT_FOLDER_PATHS.assets;
  themesPath: typeof PROJECT_FOLDER_PATHS.themes;
  snapshotsPath: typeof PROJECT_FOLDER_PATHS.snapshots;
  updatedAt: string;
}

export function createManifest(project: BookProject): ProjectManifest {
  return {
    formatVersion: 1,
    app: "epub-creator",
    projectId: project.id,
    title: project.metadata.title,
    contentPath: PROJECT_FOLDER_PATHS.content,
    assetsPath: PROJECT_FOLDER_PATHS.assets,
    themesPath: PROJECT_FOLDER_PATHS.themes,
    snapshotsPath: PROJECT_FOLDER_PATHS.snapshots,
    updatedAt: project.updatedAt
  };
}
