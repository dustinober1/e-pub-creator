import {
  createAsset,
  createBookProject,
  createSection,
  createTextBlock,
  type BookProject,
  type BookSection,
  type SectionRole,
  type TextBlock
} from "@epub-creator/core";
import { createImportReport, type ImportReport } from "./import-report";

export interface MarkdownImportOptions {
  sourcePath: string;
  author: string;
  language: string;
}

export interface MarkdownImportResult {
  project: BookProject;
  report: ImportReport;
}

interface MarkdownImage {
  altText: string;
  sourcePath: string;
  caption?: string;
}

export function importMarkdown(markdown: string, options: MarkdownImportOptions): MarkdownImportResult {
  const lines = markdown.split(/\r?\n/);
  const title = findTitle(lines);
  const project = createBookProject({
    title,
    author: options.author,
    language: options.language
  });
  const report = createImportReport(options.sourcePath);

  let currentSection: BookSection | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("# ")) {
      continue;
    }

    if (trimmed.startsWith("## ")) {
      currentSection = createSection({
        title: trimmed.slice(3).trim(),
        role: inferSectionRole(trimmed.slice(3).trim()),
        blocks: []
      });
      project.sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      continue;
    }

    const block = createBlock(trimmed, project, report, options.sourcePath);
    currentSection.blocks.push(block);
  }

  return { project, report };
}

function findTitle(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      const title = trimmed.slice(2).trim();
      return title.length > 0 ? title : "Untitled Book";
    }
  }

  return "Untitled Book";
}

function inferSectionRole(title: string): SectionRole {
  const normalized = normalizeHeading(title);
  const frontMatterLabels = ["copyright", "dedication", "title page"];
  const backMatterLabels = ["about the author", "also by", "newsletter", "acknowledgments"];

  if (frontMatterLabels.includes(normalized)) {
    return "front";
  }

  if (backMatterLabels.includes(normalized) || normalized.startsWith("also by ")) {
    return "back";
  }

  return "body";
}

function normalizeHeading(title: string): string {
  return title.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function createBlock(
  line: string,
  project: BookProject,
  report: ImportReport,
  markdownSourcePath: string
): TextBlock {
  if (line === "* * *" || line === "---") {
    return createTextBlock("scene-break", "");
  }

  if (line.startsWith(">")) {
    return createTextBlock("epigraph", line.slice(1).trimStart());
  }

  const image = parseMarkdownImage(line);

  if (image) {
    const resolvedSourcePath = resolveSourcePath(markdownSourcePath, image.sourcePath);
    const asset = createAsset({
      kind: "image",
      projectPath: `assets/${basename(image.sourcePath)}`,
      mediaType: inferMediaType(image.sourcePath),
      altText: image.altText,
      caption: image.caption,
      source: {
        type: "local-path",
        path: resolvedSourcePath
      }
    });

    project.assets.push(asset);
    report.importedAssets.push({
      sourcePath: resolvedSourcePath,
      altText: image.altText,
      caption: image.caption
    });
    report.warnings.push({
      code: "IMAGE_REFERENCE_FOUND",
      message: `Imported image reference: ${image.sourcePath}`
    });

    return createTextBlock("image", image.altText, { assetId: asset.id });
  }

  return createTextBlock("paragraph", line);
}

function parseMarkdownImage(line: string): MarkdownImage | undefined {
  const imageMatch = /^!\[([^\]]*)\]\((.+)\)$/.exec(line);

  if (!imageMatch) {
    return undefined;
  }

  const altText = imageMatch[1] ?? "";
  const target = imageMatch[2]?.trim() ?? "";
  const titleMatch = /^(\S+)\s+"([^"]*)"$/.exec(target);

  if (titleMatch) {
    return {
      altText,
      sourcePath: titleMatch[1] ?? "",
      caption: titleMatch[2] ?? ""
    };
  }

  return {
    altText,
    sourcePath: target
  };
}

function resolveSourcePath(markdownSourcePath: string, imageSourcePath: string): string {
  if (isAbsoluteOrRemote(imageSourcePath)) {
    return imageSourcePath;
  }

  const sourceDirectory = dirname(markdownSourcePath);

  if (sourceDirectory.length === 0) {
    return normalizePath(imageSourcePath);
  }

  return normalizePath(`${sourceDirectory}/${imageSourcePath}`);
}

function isAbsoluteOrRemote(path: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("/") || /^[a-z]:[\\/]/i.test(path);
}

function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");

  if (lastSlash === -1) {
    return "";
  }

  return normalized.slice(0, lastSlash);
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/[?#].*$/, "");
  const lastSlash = normalized.lastIndexOf("/");
  const name = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
  return name.length > 0 ? name : "image";
}

function normalizePath(path: string): string {
  const normalizedInput = path.replace(/\\/g, "/");
  let remainingPath = normalizedInput;
  let prefix = "";

  if (/^[a-z]:\//i.test(remainingPath)) {
    prefix = remainingPath.slice(0, 3);
    remainingPath = remainingPath.slice(3);
  } else if (remainingPath.startsWith("/")) {
    prefix = "/";
    remainingPath = remainingPath.slice(1);
  }

  const segments: string[] = [];

  for (const segment of remainingPath.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (segments.length > 0 && segments[segments.length - 1] !== "..") {
        segments.pop();
      } else if (prefix.length === 0) {
        segments.push(segment);
      }
      continue;
    }

    segments.push(segment);
  }

  return `${prefix}${segments.join("/")}`;
}

function inferMediaType(path: string): string {
  const extension = basename(path).toLocaleLowerCase().split(".").pop();

  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
