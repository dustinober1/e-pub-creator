export function ThemeEditor() {
  return (
    <section className="panel theme-editor" aria-label="Theme editor">
      <h2>Theme Editor</h2>
      <div className="theme-editor-controls">
        <label className="theme-editor-field">
          Chapter opener
          <select defaultValue="classic">
            <option value="classic">Classic</option>
            <option value="ornamented">Ornamented</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
        <label className="theme-editor-field">
          Scene break
          <select defaultValue="asterism">
            <option value="asterism">Asterism</option>
            <option value="ornament">Ornament</option>
            <option value="rule">Rule</option>
          </select>
        </label>
        <label className="theme-editor-field">
          Quote style
          <select defaultValue="indented">
            <option value="indented">Indented</option>
            <option value="left-rule">Left rule</option>
            <option value="boxed-light">Light box</option>
          </select>
        </label>
        <label className="theme-editor-field">
          Body spacing
          <input type="range" min="1.2" max="1.9" step="0.05" defaultValue="1.55" />
        </label>
      </div>
    </section>
  );
}
