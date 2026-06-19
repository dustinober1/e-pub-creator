import { createId } from "./ids";

export type AssetKind = "cover" | "image" | "font" | "ornament";

export interface ProjectAssetSource {
  type: "local-path";
  path: string;
}

export interface ProjectAsset {
  id: string;
  kind: AssetKind;
  projectPath: string;
  mediaType: string;
  altText: string;
  source?: ProjectAssetSource;
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
