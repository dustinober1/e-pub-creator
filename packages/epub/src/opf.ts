import type { BookProject } from "@epub-creator/core";

export function renderOpf(project: BookProject): string {
  const metadata = project.metadata;
  const sectionManifestItems = project.sections.map(
    (section, index) =>
      `    <item id="${escapeXmlAttribute(sectionManifestId(index))}" href="${escapeXmlAttribute(sectionHref(index))}" media-type="application/xhtml+xml" />`
  );
  const spineItems = project.sections.map(
    (_section, index) => `    <itemref idref="${escapeXmlAttribute(sectionManifestId(index))}" />`
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">',
    "  <metadata xmlns:dc=\"http://purl.org/dc/elements/1.1/\">",
    `    <dc:identifier id="pub-id">${escapeXml(metadata.identifier)}</dc:identifier>`,
    `    <dc:title>${escapeXml(metadata.title)}</dc:title>`,
    `    <dc:creator>${escapeXml(metadata.author)}</dc:creator>`,
    `    <dc:language>${escapeXml(metadata.language)}</dc:language>`,
    metadata.publisher ? `    <dc:publisher>${escapeXml(metadata.publisher)}</dc:publisher>` : "",
    metadata.rights ? `    <dc:rights>${escapeXml(metadata.rights)}</dc:rights>` : "",
    metadata.description ? `    <dc:description>${escapeXml(metadata.description)}</dc:description>` : "",
    metadata.publicationDate ? `    <dc:date>${escapeXml(metadata.publicationDate)}</dc:date>` : "",
    "  </metadata>",
    "  <manifest>",
    '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '    <item id="css" href="styles/book.css" media-type="text/css" />',
    ...sectionManifestItems,
    "  </manifest>",
    "  <spine>",
    ...spineItems,
    "  </spine>",
    "</package>"
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function sectionManifestId(index: number): string {
  return `section-${index + 1}`;
}

function sectionHref(index: number): string {
  return `sections/section-${index + 1}.xhtml`;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXml(value).replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
