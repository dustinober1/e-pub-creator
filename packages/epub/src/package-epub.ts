import type { BookProject } from "@epub-creator/core";
import { renderNavXhtml, renderSectionXhtml } from "@epub-creator/renderer";
import {
  createValidationReport,
  type ExportProfile,
  type ValidationReport,
  validateAccessibility,
  validateExportProfile
} from "@epub-creator/validation";
import { renderContainerXml } from "./container";
import { EPUB_MIMETYPE } from "./mimetype";
import { renderOpf } from "./opf";

export interface EpubPackageFile {
  path: string;
  content: string | Uint8Array;
  mediaType: string;
}

export interface EpubPackageResult {
  files: EpubPackageFile[];
  report: ValidationReport;
}

export function createEpubPackage(project: BookProject, css: string, profile: ExportProfile): EpubPackageResult {
  const accessibilityReport = validateAccessibility(project);
  const profileReport = validateExportProfile(profile, css);
  const report = createValidationReport([...accessibilityReport.issues, ...profileReport.issues]);

  return {
    files: [
      {
        path: "mimetype",
        content: EPUB_MIMETYPE,
        mediaType: "text/plain"
      },
      {
        path: "META-INF/container.xml",
        content: renderContainerXml(),
        mediaType: "application/xml"
      },
      {
        path: "EPUB/package.opf",
        content: renderOpf(project),
        mediaType: "application/oebps-package+xml"
      },
      {
        path: "EPUB/nav.xhtml",
        content: renderNavXhtml(project),
        mediaType: "application/xhtml+xml"
      },
      {
        path: "EPUB/styles/book.css",
        content: css,
        mediaType: "text/css"
      },
      ...project.sections.map((section, index) => ({
        path: `EPUB/sections/section-${index + 1}.xhtml`,
        content: renderSectionXhtml(project, section),
        mediaType: "application/xhtml+xml"
      }))
    ],
    report
  };
}
