import type { BookProject } from "@epub-creator/core";
import { escapeAttribute, escapeHtml } from "./html";

export function createPreviewDocument(project: BookProject, bodyMarkup: string, css: string): string {
  const lang = escapeAttribute(project.metadata.language);
  const title = escapeHtml(project.metadata.title);

  return [
    "<!doctype html>",
    `<html lang="${lang}">`,
    "  <head>",
    '    <meta charset="utf-8">',
    `    <title>${title}</title>`,
    "    <style>",
    escapeStyleContent(css),
    "    </style>",
    "  </head>",
    "  <body>",
    bodyMarkup,
    "  </body>",
    "</html>"
  ].join("\n");
}

function escapeStyleContent(css: string): string {
  return css.replaceAll(/<\/style/gi, "<\\/style");
}
