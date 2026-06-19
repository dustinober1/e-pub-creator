import type { ProjectAsset } from "./assets";
import { createId } from "./ids";

export type SectionRole = "front" | "body" | "back";

export type TextBlockKind =
  | "paragraph"
  | "heading"
  | "chapter-title"
  | "scene-break"
  | "blockquote"
  | "epigraph"
  | "letter"
  | "email"
  | "message"
  | "poem"
  | "image"
  | "footnote"
  | "endnote";

export interface BookMetadata {
  title: string;
  subtitle?: string;
  series?: string;
  seriesNumber?: string;
  author: string;
  contributors: Array<{ name: string; role: string }>;
  publisher?: string;
  imprint?: string;
  language: string;
  description?: string;
  keywords: string[];
  categories: string[];
  isbn?: string;
  identifier: string;
  rights?: string;
  publicationDate?: string;
  edition?: string;
  coverAssetId?: string;
}

export interface BlockStyleOverride {
  variant?: string;
  cssClass?: string;
  tokens?: Record<string, string>;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type PlainTextBlockKind = Exclude<TextBlockKind, "heading" | "image">;

export interface TextBlockBase<K extends TextBlockKind> {
  id: string;
  kind: K;
  text: string;
  noteId?: string;
  style?: BlockStyleOverride;
}

export interface PlainTextBlock extends TextBlockBase<PlainTextBlockKind> {}

export interface HeadingTextBlock extends TextBlockBase<"heading"> {
  level: HeadingLevel;
}

export interface ImageTextBlock extends TextBlockBase<"image"> {
  assetId: string;
}

export type TextBlock = PlainTextBlock | HeadingTextBlock | ImageTextBlock;

export interface TextBlockCommonInput {
  noteId?: string;
  style?: BlockStyleOverride;
}

export type PlainTextBlockInput = TextBlockCommonInput;

export interface HeadingTextBlockInput extends TextBlockCommonInput {
  level: HeadingLevel;
}

export interface ImageTextBlockInput extends TextBlockCommonInput {
  assetId: string;
}

type TextBlockCreationInput = TextBlockCommonInput & {
  level?: HeadingLevel;
  assetId?: string;
};

export interface BookSection {
  id: string;
  title: string;
  role: SectionRole;
  blocks: TextBlock[];
  includeInToc: boolean;
  source?: {
    path: string;
    sourceBlockId?: string;
  };
}

export interface BookProject {
  id: string;
  formatVersion: 1;
  metadata: BookMetadata;
  sections: BookSection[];
  assets: ProjectAsset[];
  theme: {
    packageId: string;
    variant?: string;
    overrides: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export function createBookProject(input: {
  title: string;
  author: string;
  language: string;
  identifier?: string;
}): BookProject {
  const now = new Date().toISOString();

  return {
    id: createId("book"),
    formatVersion: 1,
    metadata: {
      title: input.title,
      author: input.author,
      language: input.language,
      contributors: [],
      keywords: [],
      categories: [],
      identifier: input.identifier ?? createId("publication")
    },
    sections: [],
    assets: [],
    theme: {
      packageId: "classic-literary",
      overrides: {}
    },
    createdAt: now,
    updatedAt: now
  };
}

export function createSection(input: {
  title: string;
  role: SectionRole;
  blocks: TextBlock[];
  includeInToc?: boolean;
}): BookSection {
  return {
    id: createId("section"),
    title: input.title,
    role: input.role,
    blocks: input.blocks,
    includeInToc: input.includeInToc ?? input.role === "body"
  };
}

export function createTextBlock(
  kind: "heading",
  text: string,
  input: HeadingTextBlockInput
): HeadingTextBlock;
export function createTextBlock(kind: "image", text: string, input: ImageTextBlockInput): ImageTextBlock;
export function createTextBlock(
  kind: PlainTextBlockKind,
  text: string,
  input?: PlainTextBlockInput
): PlainTextBlock;
export function createTextBlock(
  kind: TextBlockKind,
  text: string,
  input: TextBlockCreationInput = {}
): TextBlock {
  return {
    id: createId("block"),
    kind,
    text,
    ...input
  } as TextBlock;
}
