import type { ThemePackage } from "./theme-package";
import { validateThemePackage } from "./theme-package";

export const BUNDLED_THEME_CATALOG = [
  { id: "classic-literary", name: "Classic Literary" },
  { id: "modern-clean", name: "Modern Clean" },
  { id: "romance-soft", name: "Romance Soft" },
  { id: "thriller-stark", name: "Thriller Stark" },
  { id: "fantasy-ornate", name: "Fantasy Ornate" },
  { id: "sci-fi-minimal", name: "Sci-Fi Minimal" },
  { id: "historical-serif", name: "Historical Serif" },
  { id: "memoir-warm", name: "Memoir Warm" },
  { id: "nonfiction-clear", name: "Nonfiction Clear" },
  { id: "young-adult-bright", name: "Young Adult Bright" },
  { id: "dark-academia", name: "Dark Academia" },
  { id: "large-print-accessible", name: "Large Print Accessible" }
] as const;

export interface ThemeRegistry {
  themes: ThemePackage[];
}

export function createThemeRegistry(packages: unknown[]): ThemeRegistry {
  return {
    themes: packages.map(validateThemePackage)
  };
}

export function findTheme(registry: ThemeRegistry, id: string): ThemePackage {
  const theme = registry.themes.find((candidate) => candidate.id === id);

  if (!theme) {
    throw new Error(`Theme not found: ${id}`);
  }

  return theme;
}
