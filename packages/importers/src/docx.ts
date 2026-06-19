import * as mammoth from "mammoth";
import { importHtmlFragment, type HtmlImportOptions, type HtmlImportResult } from "./html-to-book";
import type { ImportReport, ImportWarning } from "./import-report";

export interface DocxImportOptions extends HtmlImportOptions {
  styleMap?: string[];
}

interface MammothMessage {
  type: string;
  message: string;
}

export async function importDocx(path: string, options: DocxImportOptions): Promise<HtmlImportResult> {
  const imageWarnings: ImportWarning[] = [];
  const result = await mammoth.convertToHtml(
    { path },
    {
      styleMap: options.styleMap ?? [
        "p[style-name='Chapter Title'] => h2:fresh",
        "p[style-name='Scene Break'] => p.scene-break:fresh",
        "p[style-name='Epigraph'] => blockquote:fresh",
        "p[style-name='Letter'] => p.letter:fresh"
      ],
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: true,
      convertImage: mammoth.images.imgElement(async (image) =>
        createUnsupportedDocxImageAttributes(image.contentType, imageWarnings)
      )
    }
  );
  const imported = importHtmlFragment(result.value, options);

  imported.report.warnings.push(...imageWarnings);
  appendMammothMessages(imported.report, result.messages);

  return imported;
}

function createUnsupportedDocxImageAttributes(
  contentType: string,
  warnings: ImportWarning[]
): { src: string; alt: string } {
  warnings.push({
    code: "IMAGE_REFERENCE_FOUND",
    message: `DOCX image import is not supported yet: ${contentType}`
  });

  return {
    src: "data:,",
    alt: "Unsupported DOCX image"
  };
}

function appendMammothMessages(report: ImportReport, messages: MammothMessage[]): void {
  for (const message of messages) {
    report.warnings.push({
      code: "UNCLASSIFIED_BLOCK",
      message: `${message.type}: ${message.message}`
    });
  }
}
