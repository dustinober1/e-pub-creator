const themes = [
  { id: "classic-literary", name: "Classic Literary" },
  { id: "modern-clean", name: "Modern Clean" }
];

export function ThemeGallery() {
  return (
    <section className="panel" aria-labelledby="themes-heading">
      <h2 id="themes-heading">Themes</h2>
      <div className="theme-grid">
        {themes.map((theme) => (
          <button className="theme-button" key={theme.id} type="button">
            {theme.name}
          </button>
        ))}
      </div>
    </section>
  );
}
