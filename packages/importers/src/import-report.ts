export interface ImportWarning {
  code:
    | "IMPORT_REVIEW_REQUIRED"
    | "UNCLASSIFIED_BLOCK"
    | "IMAGE_REFERENCE_FOUND"
    | "COMMENTS_NOT_IMPORTED"
    | "TRACKED_CHANGES_NOT_IMPORTED";
  message: string;
}

export interface ImportReport {
  sourcePath: string;
  warnings: ImportWarning[];
  importedAssets: Array<{
    sourcePath: string;
    altText: string;
    caption?: string;
  }>;
}

export function createImportReport(sourcePath: string): ImportReport {
  return {
    sourcePath,
    warnings: [
      {
        code: "IMPORT_REVIEW_REQUIRED",
        message: "Review detected section roles and block classifications before export."
      }
    ],
    importedAssets: []
  };
}
