import type { BookProject, BookSection, TextBlock } from "@epub-creator/core";

const SECTION_EPUB_TYPES: Record<BookSection["role"], string> = {
  front: "frontmatter",
  body: "chapter",
  back: "backmatter"
};

export function renderSectionXhtml(project: BookProject, section: BookSection): string {
  const lang = escapeAttribute(project.metadata.language);
  const title = escapeHtml(section.title);
  const sectionType = SECTION_EPUB_TYPES[section.role];
  const renderedBlocks = section.blocks.map((block) => renderBlock(project, block)).join("\n      ");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE html>',
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">`,
    "  <head>",
    '    <meta charset="utf-8" />',
    `    <title>${title}</title>`,
    '    <link rel="stylesheet" type="text/css" href="../styles/book.css" />',
    "  </head>",
    "  <body>",
    `    <section epub:type="${sectionType}" id="${escapeAttribute(section.id)}">`,
    `      <header class="chapter-title"><h1>${title}</h1></header>`,
    renderedBlocks ? `      ${renderedBlocks}` : "",
    "    </section>",
    "  </body>",
    "</html>"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function renderBlock(project: BookProject, block: TextBlock): string {
  switch (block.kind) {
    case "paragraph":
      return renderTextElement("p", block, "paragraph");
    case "scene-break":
      return '<div class="scene-break" aria-hidden="true"></div>';
    case "epigraph":
      return renderTextElement("blockquote", block, "epigraph");
    case "blockquote":
      return renderTextElement("blockquote", block, "blockquote");
    case "letter":
      return renderTextElement("div", block, "letter");
    case "email":
      return renderTextElement("div", block, "email");
    case "message":
      return renderTextElement("div", block, "message");
    case "poem":
      return renderPoem(block);
    case "image":
      return renderImage(project, block);
    case "footnote":
      return renderNote(block, "footnote");
    case "endnote":
      return renderNote(block, "endnote");
    case "heading":
      return `<h${block.level} class="${escapeAttribute(classNameFor(block, "heading"))}">${escapeHtml(block.text)}</h${block.level}>`;
    case "chapter-title":
      return renderTextElement("h1", block, "chapter-title");
  }
}

function renderTextElement(tagName: string, block: TextBlock, baseClassName: string): string {
  return `<${tagName} class="${escapeAttribute(classNameFor(block, baseClassName))}">${escapeHtml(block.text)}</${tagName}>`;
}

function renderPoem(block: TextBlock): string {
  const lines = block.text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  return `<div class="${escapeAttribute(classNameFor(block, "poem"))}">${lines}</div>`;
}

function renderImage(project: BookProject, block: Extract<TextBlock, { kind: "image" }>): string {
  const asset = project.assets.find((candidate) => candidate.id === block.assetId);

  if (!asset) {
    throw new Error(`Image asset not found: ${block.assetId}`);
  }

  return `<figure class="${escapeAttribute(classNameFor(block, "image"))}"><img src="${escapeAttribute(`../${asset.projectPath}`)}" alt="${escapeAttribute(asset.altText)}" /></figure>`;
}

function renderNote(block: TextBlock, type: "footnote" | "endnote"): string {
  const id = block.noteId ? ` id="${escapeAttribute(block.noteId)}"` : "";

  return `<aside${id} epub:type="${type}" class="${escapeAttribute(classNameFor(block, type))}">${escapeHtml(block.text)}</aside>`;
}

function classNameFor(block: TextBlock, baseClassName: string): string {
  return [baseClassName, block.style?.cssClass].filter(Boolean).join(" ");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
