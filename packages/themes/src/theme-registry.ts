import type { ThemePackage } from "./theme-package";
import { validateThemePackage } from "./theme-package";

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
