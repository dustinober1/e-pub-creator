import { createId } from "./ids";

export type AssetKind = "cover" | "image" | "font" | "ornament";

export interface ProjectAsset {
  id: string;
  kind: AssetKind;
  sourcePath: string;
  projectPath: string;
  mediaType: string;
  altText: string;
  caption?: string;
  license?: {
    name: string;
    spdxId?: string;
    url?: string;
  };
}

export function createAsset(input: Omit<ProjectAsset, "id">): ProjectAsset {
  return {
    id: createId("asset"),
    ...input
  };
}
