export interface ThemeFontLicense {
  name: string;
  spdxId: string;
  url: string;
}

export interface ThemeFont {
  family: string;
  file: string;
  license: ThemeFontLicense;
}

export interface ThemePackage {
  id: string;
  version: string;
  name: string;
  description: string;
  license: string;
  cssPath: string;
  preview: {
    thumbnailPath: string;
    sampleText: string;
  };
  tokens: Record<string, string>;
  fonts: ThemeFont[];
  components: Record<string, string[]>;
}

export function validateThemePackage(value: unknown): ThemePackage {
  if (!isRecord(value)) {
    throw new Error("Theme package must be an object.");
  }

  const theme = value as Partial<ThemePackage>;
  const requiredStrings: Array<keyof ThemePackage> = ["id", "version", "name", "description", "license", "cssPath"];

  for (const key of requiredStrings) {
    if (typeof theme[key] !== "string" || String(theme[key]).trim() === "") {
      throw new Error(`Theme field is required: ${String(key)}`);
    }
  }

  assertBundleLocalPath(theme.cssPath, "cssPath");

  if (
    !isRecord(theme.preview) ||
    !isNonEmptyString(theme.preview.thumbnailPath) ||
    !isNonEmptyString(theme.preview.sampleText)
  ) {
    throw new Error("Theme preview metadata is required.");
  }

  assertBundleLocalPath(theme.preview.thumbnailPath, "preview.thumbnailPath");

  if (!isRecord(theme.tokens) || !Object.values(theme.tokens).every(isNonEmptyString)) {
    throw new Error("Theme tokens must be non-empty string values.");
  }

  if (!Array.isArray(theme.fonts)) {
    throw new Error("Theme fonts must be an array.");
  }

  for (const [index, font] of theme.fonts.entries()) {
    if (!isRecord(font)) {
      throw new Error("Theme font must be an object.");
    }

    if (!isNonEmptyString(font.family)) {
      throw new Error("Theme font family is required.");
    }

    if (!isNonEmptyString(font.file)) {
      throw new Error(`Theme font file is required for ${font.family}.`);
    }

    assertBundleLocalPath(font.file, `fonts[${index}].file`);

    if (
      !isNonEmptyString(font.license?.name) ||
      !isNonEmptyString(font.license.spdxId) ||
      !isNonEmptyString(font.license.url)
    ) {
      throw new Error(`Complete font license metadata is required for ${font.family}.`);
    }
  }

  if (
    !isRecord(theme.components) ||
    !Object.values(theme.components).every(
      (component) => Array.isArray(component) && component.every(isNonEmptyString)
    )
  ) {
    throw new Error("Theme components must be arrays of non-empty strings.");
  }

  return theme as ThemePackage;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertBundleLocalPath(value: string | undefined, fieldName: string): void {
  if (!value || !isBundleLocalPath(value)) {
    throw new Error(`Theme asset path must be bundle-local: ${fieldName}`);
  }
}

function isBundleLocalPath(value: string): boolean {
  if (!isNonEmptyString(value) || value.startsWith("/") || value.includes("\\") || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return false;
  }

  const segments = value.split("/");

  return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
}
