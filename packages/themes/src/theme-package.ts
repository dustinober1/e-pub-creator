export interface ThemeFontLicense {
  name: string;
  spdxId?: string;
  url?: string;
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
  if (!value || typeof value !== "object") {
    throw new Error("Theme package must be an object.");
  }

  const theme = value as ThemePackage;
  const requiredStrings: Array<keyof ThemePackage> = ["id", "version", "name", "description", "license", "cssPath"];

  for (const key of requiredStrings) {
    if (typeof theme[key] !== "string" || String(theme[key]).trim() === "") {
      throw new Error(`Theme field is required: ${String(key)}`);
    }
  }

  if (!theme.preview?.thumbnailPath || !theme.preview.sampleText) {
    throw new Error("Theme preview metadata is required.");
  }

  for (const font of theme.fonts ?? []) {
    if (!font.license?.name) {
      throw new Error(`Font license metadata is required for ${font.family}.`);
    }
  }

  return theme;
}
