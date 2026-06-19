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
    if (isRemoteUrl(image.sourcePath)) {
      report.warnings.push({
        code: "IMAGE_REFERENCE_FOUND",
        message: `Remote image import is not supported yet: ${image.sourcePath}`
      });

      return createTextBlock("paragraph", line);
    }

    const imageFilename = basename(image.sourcePath);

    if (!isUsableImageFilename(imageFilename)) {
      report.warnings.push({
        code: "IMAGE_REFERENCE_FOUND",
        message: `Skipped image reference with invalid filename: ${image.sourcePath}`
      });

      return createTextBlock("paragraph", line);
    }

    const resolvedSourcePath = resolveSourcePath(markdownSourcePath, image.sourcePath);
    const asset = createAsset({
      kind: "image",
      projectPath: createImageProjectPath(project, imageFilename),
      mediaType: inferMediaType(imageFilename),
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
      message: `Imported local image reference: ${image.sourcePath}`
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
  if (isAbsolutePath(imageSourcePath)) {
    return imageSourcePath;
  }

  const sourceDirectory = dirname(markdownSourcePath);

  if (sourceDirectory.length === 0) {
    return normalizePath(imageSourcePath);
  }

  return normalizePath(`${sourceDirectory}/${imageSourcePath}`);
}

function isRemoteUrl(path: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(path) || (hasUriScheme(path) && !/^[a-z]:[\\/]/i.test(path));
}

function hasUriScheme(path: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(path);
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith("/") || /^[a-z]:[\\/]/i.test(path);
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
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

function isUsableImageFilename(filename: string): boolean {
  return filename !== "" && filename !== "." && filename !== "..";
}

function createImageProjectPath(project: BookProject, filename: string): string {
  const safeFilename = sanitizeFilename(filename);
  const usedProjectPaths = new Set(project.assets.map((asset) => asset.projectPath));
  let sequence = project.assets.length + 1;
  let projectPath = "";

  do {
    projectPath = `assets/images/${sequence.toString().padStart(3, "0")}-${safeFilename}`;
    sequence += 1;
  } while (usedProjectPaths.has(projectPath));

  return projectPath;
}

function sanitizeFilename(filename: string): string {
  const normalized = filename.toLocaleLowerCase();
  const extensionIndex = normalized.lastIndexOf(".");
  const stem = extensionIndex > 0 ? normalized.slice(0, extensionIndex) : normalized;
  const extension = extensionIndex > 0 ? normalized.slice(extensionIndex).replace(/[^.a-z0-9]/g, "") : "";
  const safeStem = stem.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return `${safeStem.length > 0 ? safeStem : "image"}${extension}`;
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
