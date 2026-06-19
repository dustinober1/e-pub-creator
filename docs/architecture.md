# Architecture

EPUB Creator is a local-first formatter. The app stores projects as folders, keeps manuscript content in structured JSON, and uses the same core packages from the CLI, local server, and React UI.

## Packages

- `@epub-creator/core`: project model, assets, manifest, snapshots, project folders.
- `@epub-creator/importers`: DOCX/Markdown import and import review reports.
- `@epub-creator/themes`: declarative theme packages and registry.
- `@epub-creator/renderer`: EPUB XHTML, navigation, CSS merging, and preview HTML.
- `@epub-creator/validation`: accessibility and export profile reports.
- `@epub-creator/epub`: EPUB package document generation.
- `@epub-creator/cli`: import, validate, export, and theme commands.

## App Shells

- `apps/local-server`: local filesystem and API companion process.
- `apps/web`: Vite React structured editor and preview interface.
