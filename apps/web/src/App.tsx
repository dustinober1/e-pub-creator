export function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>EPUB Creator</h1>
          <p>Local-first book formatting workspace</p>
        </div>
      </header>
      <section className="workspace-grid" aria-label="Workspace">
        <nav className="panel" aria-label="Book outline">
          <h2>Outline</h2>
          <p>No project loaded.</p>
        </nav>
        <section className="panel" aria-label="Editor">
          <h2>Editor</h2>
          <p>Import a DOCX or Markdown file to start.</p>
        </section>
        <aside className="panel" aria-label="Preview and validation">
          <h2>Preview</h2>
          <p>EPUB XHTML preview will render here.</p>
        </aside>
      </section>
    </main>
  );
}
