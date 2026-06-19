import type { BookProject, ProjectAsset } from "@epub-creator/core";

export function renderOpf(project: BookProject): string {
  const metadata = project.metadata;
  const sectionManifestItems = project.sections.map(
    (section, index) =>
      `    <item id="${escapeXmlAttribute(sectionManifestId(index))}" href="${escapeXmlAttribute(sectionHref(index))}" media-type="application/xhtml+xml" />`
  );
  const spineItems = project.sections.map(
    (_section, index) => `    <itemref idref="${escapeXmlAttribute(sectionManifestId(index))}" />`
  );
  const assetManifestItems = getReferencedAssets(project).map(
    (asset, index) =>
      `    <item id="${escapeXmlAttribute(assetManifestId(index))}" href="${escapeXmlAttribute(asset.projectPath)}" media-type="${escapeXmlAttribute(asset.mediaType)}" />`
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
    `    <meta property="dcterms:modified">${escapeXml(formatModifiedDate(project.updatedAt))}</meta>`,
    "  </metadata>",
    "  <manifest>",
    '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '    <item id="css" href="styles/book.css" media-type="text/css" />',
    ...sectionManifestItems,
    ...assetManifestItems,
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

function assetManifestId(index: number): string {
  return `asset-${index + 1}`;
}

function getReferencedAssets(project: BookProject): ProjectAsset[] {
  const referencedAssetIds = new Set(
    project.sections.flatMap((section) =>
      section.blocks.flatMap((block) => (block.kind === "image" ? [block.assetId] : []))
    )
  );

  return project.assets.filter((asset) => referencedAssetIds.has(asset.id));
}

function formatModifiedDate(value: string): string {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXml(value).replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
