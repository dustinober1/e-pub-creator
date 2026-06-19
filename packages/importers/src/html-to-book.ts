import {
  createBookProject,
  createSection,
  createTextBlock,
  type BookProject,
  type SectionRole,
  type TextBlock
} from "@epub-creator/core";
import { createImportReport, type ImportReport } from "./import-report";

type HtmlTag = "h1" | "h2" | "p" | "blockquote" | "li";

interface HtmlToken {
  tag: HtmlTag;
  html: string;
  text: string;
  classNames: string[];
}

export interface HtmlImportOptions {
  sourcePath: string;
  author: string;
  language: string;
}

export interface HtmlImportResult {
  project: BookProject;
  report: ImportReport;
}

export function importHtmlFragment(html: string, options: HtmlImportOptions): HtmlImportResult {
  const tokens = parseHtmlTokens(html);
  const title = textOfFirst(tokens, "h1") ?? "Untitled Book";
  const project = createBookProject({
    title,
    author: options.author,
    language: options.language
  });
  const report = createImportReport(options.sourcePath);

  let currentTitle = "";
  let blocks: TextBlock[] = [];

  function flush(): void {
    if (!currentTitle) {
      return;
    }

    project.sections.push(
      createSection({
        title: currentTitle,
        role: inferRole(currentTitle),
        blocks
      })
    );
    blocks = [];
  }

  for (const [index, token] of tokens.entries()) {
    if (token.tag === "h1" || token.tag === "h2") {
      if (isDocumentTitleHeading(tokens, index, title)) {
        continue;
      }

      flush();
      currentTitle = token.text;
      continue;
    }

    if (!currentTitle) {
      continue;
    }

    if (token.tag === "blockquote") {
      blocks.push(createTextBlock("epigraph", token.text));
      continue;
    }

    if (token.tag === "li" && isNoteBodyItem(token)) {
      blocks.push(createTextBlock("footnote", stripNoteBacklinks(token.html)));
      continue;
    }

    if (token.tag === "p" && isNoteReferenceParagraph(token)) {
      continue;
    }

    if (token.tag === "p" && token.classNames.includes("scene-break")) {
      blocks.push(createTextBlock("scene-break", ""));
      continue;
    }

    if (token.tag === "p" && token.classNames.includes("letter")) {
      blocks.push(createTextBlock("letter", token.text));
      continue;
    }

    if (token.text && !/^\d+$/.test(token.text)) {
      blocks.push(createTextBlock("paragraph", token.text));
    }
  }

  flush();
  return { project, report };
}

function parseHtmlTokens(html: string): HtmlToken[] {
  const normalizedHtml = html.replace(/\r?\n/g, " ");
  const tokenMatches = normalizedHtml.matchAll(/<(h1|h2|p|blockquote|li)\b[^>]*>.*?<\/\1>/gi);

  return Array.from(tokenMatches, (match) => {
    const tokenHtml = match[0] ?? "";
    const tag = (match[1] ?? "p").toLocaleLowerCase() as HtmlTag;

    return {
      tag,
      html: tokenHtml,
      text: stripTags(tokenHtml),
      classNames: readClassNames(tokenHtml)
    };
  });
}

function textOfFirst(tokens: HtmlToken[], tag: HtmlTag): string | undefined {
  return tokens.find((token) => token.tag === tag && token.text.length > 0)?.text;
}

function isDocumentTitleHeading(tokens: HtmlToken[], index: number, title: string): boolean {
  const token = tokens[index];

  if (!token || token.tag !== "h1" || token.text !== title) {
    return false;
  }

  const firstH1Index = tokens.findIndex((candidate) => candidate.tag === "h1" && candidate.text.length > 0);

  if (index !== firstH1Index) {
    return false;
  }

  for (let nextIndex = index + 1; nextIndex < tokens.length; nextIndex += 1) {
    const nextToken = tokens[nextIndex];

    if (!nextToken) {
      continue;
    }

    if (nextToken.tag === "h1" || nextToken.tag === "h2") {
      return true;
    }

    if (hasMeaningfulBodyContent(nextToken)) {
      return false;
    }
  }

  return false;
}

function hasMeaningfulBodyContent(token: HtmlToken): boolean {
  if (token.tag === "p" && isNoteReferenceParagraph(token)) {
    return false;
  }

  return token.text.length > 0 || token.classNames.includes("scene-break");
}

function readClassNames(html: string): string[] {
  const classMatch = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(openingTagOf(html));
  const classValue = classMatch?.[1] ?? classMatch?.[2] ?? classMatch?.[3] ?? "";
  return classValue
    .split(/\s+/)
    .map((className) => className.trim())
    .filter((className) => className.length > 0);
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoteReferenceParagraph(token: HtmlToken): boolean {
  return (
    /\b(?:footnote|endnote)-ref\b/i.test(token.html) &&
    token.text.length > 0 &&
    /^[\s\d[\]().,:;]+$/.test(token.text)
  );
}

function isNoteBodyItem(token: HtmlToken): boolean {
  return /\b(?:footnote|endnote)\b/i.test(openingTagOf(token.html));
}

function stripNoteBacklinks(html: string): string {
  const withoutBacklinkAnchors = html.replace(/<a\b[^>]*#?(?:footnote|endnote)-ref[^>]*>.*?<\/a>/gi, "");

  return stripTags(withoutBacklinkAnchors)
    .replace(/(?:↑|&uarr;|&#8593;)/gi, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function openingTagOf(html: string): string {
  return html.match(/^<[^>]+>/)?.[0] ?? "";
}

function inferRole(title: string): SectionRole {
  const normalized = title.toLocaleLowerCase().replace(/\s+/g, " ").trim();
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
