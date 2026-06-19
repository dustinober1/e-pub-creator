import { BUNDLED_THEME_CATALOG } from "@epub-creator/themes";

export function themesCommand(): string {
  return JSON.stringify(
    {
      themes: BUNDLED_THEME_CATALOG.map((theme) => theme.id)
    },
    null,
    2
  );
}
