import {
  createBookProject,
  createSection,
  createTextBlock,
  type BookProject,
  type SectionRole,
  type TextBlock
} from "@epub-creator/core";
import { createImportReport, type ImportReport } from "./import-report";

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
  const title = textOfFirst(html, "h1") ?? "Untitled Book";
  const project = createBookProject({
    title,
    author: options.author,
    language: options.language
  });
  const report = createImportReport(options.sourcePath);
  const tokens = html.replace(/\r?\n/g, " ").match(/<(h2|p|blockquote|li)\b[^>]*>.*?<\/\1>/gi) ?? [];

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

  for (const token of tokens) {
    if (/^<h2\b/i.test(token)) {
      flush();
      currentTitle = stripTags(token);
      continue;
    }

    if (!currentTitle) {
      continue;
    }

    if (/^<blockquote\b/i.test(token)) {
      blocks.push(createTextBlock("epigraph", stripTags(token)));
      continue;
    }

    if (/^<li\b/i.test(token) && /\bfootnote/i.test(token)) {
      blocks.push(createTextBlock("footnote", stripTags(token)));
      continue;
    }

    const text = stripTags(token);
    if (text && !/^\d+$/.test(text)) {
      blocks.push(createTextBlock("paragraph", text));
    }
  }

  flush();
  return { project, report };
}

function textOfFirst(html: string, tag: string): string | undefined {
  const match = html.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "i"));
  return match ? stripTags(match[1] ?? "") : undefined;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
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
