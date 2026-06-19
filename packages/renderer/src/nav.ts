import type { BookProject } from "@epub-creator/core";
import { escapeAttribute, escapeHtml } from "./html";

export function renderNavXhtml(project: BookProject): string {
  const lang = escapeAttribute(project.metadata.language);
  const title = escapeHtml(project.metadata.title);
  const items = project.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.includeInToc)
    .map(
      ({ section, index }) =>
        `<li><a href="${escapeAttribute(`sections/section-${index + 1}.xhtml`)}">${escapeHtml(section.title)}</a></li>`
    )
    .join("\n        ");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE html>',
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">`,
    "  <head>",
    '    <meta charset="utf-8" />',
    `    <title>${title} Table of Contents</title>`,
    "  </head>",
    "  <body>",
    '    <nav epub:type="toc" id="toc">',
    "      <h1>Table of Contents</h1>",
    "      <ol>",
    items ? `        ${items}` : "",
    "      </ol>",
    "    </nav>",
    "  </body>",
    "</html>"
  ]
    .filter((line) => line !== "")
    .join("\n");
}
