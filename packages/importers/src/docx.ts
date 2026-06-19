import * as mammoth from "mammoth";
import { importHtmlFragment, type HtmlImportOptions, type HtmlImportResult } from "./html-to-book";

export interface DocxImportOptions extends HtmlImportOptions {
  styleMap?: string[];
}

export async function importDocx(path: string, options: DocxImportOptions): Promise<HtmlImportResult> {
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
      ignoreEmptyParagraphs: true
    }
  );
  const imported = importHtmlFragment(result.value, options);

  for (const message of result.messages) {
    imported.report.warnings.push({
      code: "UNCLASSIFIED_BLOCK",
      message: `${message.type}: ${message.message}`
    });
  }

  return imported;
}
