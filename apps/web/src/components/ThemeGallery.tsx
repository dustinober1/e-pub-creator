import { BUNDLED_THEME_CATALOG } from "@epub-creator/themes";

export function ThemeGallery() {
  return (
    <section className="panel" aria-labelledby="themes-heading">
      <h2 id="themes-heading">Themes</h2>
      <div className="button-row theme-actions">
        <button type="button">Import Theme</button>
        <button type="button">Export Theme</button>
      </div>
      <div className="theme-grid">
        {BUNDLED_THEME_CATALOG.map((theme) => (
          <button className="theme-button" key={theme.id} type="button">
            {theme.name}
          </button>
        ))}
      </div>
    </section>
  );
}
