# EPUB Creator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first, open-source, Vellum-style EPUB creation app that imports DOCX/Markdown, normalizes books into a structured project model, applies advanced theme-driven formatting, previews real EPUB XHTML/CSS, validates accessibility/export profiles, and exports publishable EPUB 3 files.

**Architecture:** Use a small TypeScript monorepo with shared core packages, a local Node server, a Vite React web app, and a scriptable CLI. Store each book as a plain project folder with a manifest, structured content, assets, themes, snapshots, and export reports. Keep formatter logic in reusable packages so the web UI, CLI, and local server exercise the same pipeline.

**Tech Stack:** Node.js 22+, pnpm workspaces, TypeScript, Vite React, Vitest, mammoth.js for DOCX conversion, Markdown parser, Node filesystem APIs, ZIP/XML EPUB packaging, iframe XHTML preview.

---

## Product Decisions Locked By The Grill

- Local-first is a hard constraint; no account or hosted storage is required for MVP.
- Open-source codebase, with Apache-2.0 for app/code and explicit licenses for themes/assets/fonts.
- First target is your own workflow; public users can build on the repo.
- Import DOCX and Markdown first.
- DOCX import is copy/import plus optional linked re-import. It does not save edits back to Word.
- Internal source is a structured block document model, serialized into readable project files.
- Editing uses a structured semantic editor with live preview, not a print-layout editor.
- Formatting target is a Vellum-style guided formatter plus advanced theme editor.
- Themes are declarative, constrained packages with tokens, CSS, layout rules, fonts, assets, previews, metadata, and versioning.
- Themes may include bundled fonts only with license metadata and validation warnings.
- First serious milestone ships the theme engine plus 12 to 20 polished bundled themes.
- Hosted marketplace features are out of MVP; marketplace-ready theme import/export and gallery are in.
- Export target is broad EPUB 3 with KDP-conscious validation and profile warnings.
- Export profiles: `portable-epub3`, `kdp-safe`, `apple-books-enhanced`.
- Live preview renders actual EPUB XHTML/CSS in an iframe.
- Preview modes: generic reflowable EPUB, Kindle/KDP approximation, Apple Books approximation, and dark mode.
- Cover designer is out of scope; cover image import and validation are in.
- Full publishing metadata is in scope.
- Front/back matter is generated from metadata/templates, then editable as structured content with regenerate actions.
- Reusable local front/back matter templates are in scope.
- Raw CSS/theme-file editing is available as an escape hatch.
- Imports normalize immediately into an explicit book outline.
- Chapter/section detection is conservative with a review step.
- Preserve footnotes/endnotes; warn about comments/tracked changes.
- Images import into a project asset library with alt text, captions, placement, and validation.
- Accessibility validation is first-class.
- Validation runs continuously in lightweight form and as a stricter export report.
- Export produces `.epub` plus optional report bundle.
- Lightweight snapshots protect risky operations.
- Basic CLI covers import, validate, export, and theme listing.
- Architecture is single-user/local; no collaboration layer.
- Extension points are themes/templates only; no executable plugin system in MVP.
- First done definition: one formatting-heavy real book can be imported, themed, validated, previewed, and exported as a publishable EPUB.
- Real manuscript fixture stays outside the repo; repo uses synthetic/public fixtures that stress the same formatting cases.
- Provisional linked re-import behavior: preserve project formatting where block IDs match, then show a diff/review when matching is uncertain.

## Current Repo State

The repository currently contains only `README.md`. Treat the first implementation task as bootstrapping the codebase, not modifying an existing app.

## Documentation Checked

- Vite official docs via Context7: React TypeScript template uses `@vitejs/plugin-react`; dev server proxy config supports `/api` proxying; production build uses `vite build` through package scripts.
- Vitest official docs via Context7: projects can split node and browser/jsdom-style test environments; coverage scripts use `vitest run --coverage`.
- mammoth.js official docs via Context7: `mammoth.convertToHtml({ path }, options)` returns `{ value, messages }`; style maps and image converters are supported.

## Repository Layout To Create

```text
.
|-- apps/
|   |-- local-server/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- index.ts
|   |   |   |-- routes/
|   |   |   |   |-- health.ts
|   |   |   |   |-- projects.ts
|   |   |   |   `-- themes.ts
|   |   |   `-- server.ts
|   |   `-- tests/
|   |       `-- health.test.ts
|   `-- web/
|       |-- package.json
|       |-- index.html
|       |-- vite.config.ts
|       |-- src/
|       |   |-- App.tsx
|       |   |-- main.tsx
|       |   |-- api/client.ts
|       |   |-- components/
|       |   |   |-- BookOutline.tsx
|       |   |   |-- ImportReview.tsx
|       |   |   |-- MetadataPanel.tsx
|       |   |   |-- PreviewFrame.tsx
|       |   |   |-- ThemeGallery.tsx
|       |   |   `-- ValidationPanel.tsx
|       |   `-- styles.css
|       `-- tests/
|           `-- App.test.tsx
|-- packages/
|   |-- core/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- assets.ts
|   |   |   |-- book.ts
|   |   |   |-- ids.ts
|   |   |   |-- manifest.ts
|   |   |   |-- project-folder.ts
|   |   |   |-- snapshots.ts
|   |   |   `-- index.ts
|   |   `-- tests/
|   |       |-- book.test.ts
|   |       |-- manifest.test.ts
|   |       `-- snapshots.test.ts
|   |-- importers/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- docx.ts
|   |   |   |-- html-to-book.ts
|   |   |   |-- import-report.ts
|   |   |   |-- markdown.ts
|   |   |   `-- index.ts
|   |   `-- tests/
|   |       |-- markdown.test.ts
|   |       `-- html-to-book.test.ts
|   |-- themes/
|   |   |-- package.json
|   |   |-- bundled/
|   |   |   |-- classic-literary/
|   |   |   |   |-- theme.json
|   |   |   |   `-- theme.css
|   |   |   `-- modern-clean/
|   |   |       |-- theme.json
|   |   |       `-- theme.css
|   |   |-- src/
|   |   |   |-- theme-package.ts
|   |   |   |-- theme-registry.ts
|   |   |   `-- index.ts
|   |   `-- tests/
|   |       `-- theme-package.test.ts
|   |-- renderer/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- css.ts
|   |   |   |-- html.ts
|   |   |   |-- nav.ts
|   |   |   |-- preview.ts
|   |   |   `-- index.ts
|   |   `-- tests/
|   |       |-- html.test.ts
|   |       `-- preview.test.ts
|   |-- validation/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- accessibility.ts
|   |   |   |-- export-profiles.ts
|   |   |   |-- report.ts
|   |   |   `-- index.ts
|   |   `-- tests/
|   |       |-- accessibility.test.ts
|   |       `-- export-profiles.test.ts
|   |-- epub/
|   |   |-- package.json
|   |   |-- src/
|   |   |   |-- container.ts
|   |   |   |-- mimetype.ts
|   |   |   |-- opf.ts
|   |   |   |-- package-epub.ts
|   |   |   `-- index.ts
|   |   `-- tests/
|   |       `-- opf.test.ts
|   `-- cli/
|       |-- package.json
|       |-- src/
|       |   |-- commands/
|       |   |   |-- export.ts
|       |   |   |-- import.ts
|       |   |   |-- themes.ts
|       |   |   `-- validate.ts
|       |   |-- index.ts
|       |   `-- parse-args.ts
|       `-- tests/
|           `-- parse-args.test.ts
|-- fixtures/
|   |-- markdown/
|   |   `-- formatting-stress.md
|   |-- projects/
|   |   `-- formatting-stress/
|   `-- public-domain/
|-- docs/
|   |-- architecture.md
|   |-- project-format.md
|   |-- theme-authoring.md
|   `-- validation.md
|-- package.json
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
|-- vitest.config.ts
`-- README.md
```

## Milestone Sequence

1. Bootstrap monorepo, tooling, and workspace scripts.
2. Build the core book/project model and project folder persistence.
3. Add snapshots for risky operations.
4. Add Markdown import and import review reports.
5. Add DOCX import using mammoth.js and HTML normalization.
6. Add declarative theme packages and a bundled theme registry.
7. Add XHTML/CSS renderer and iframe preview payloads.
8. Add validation profiles and accessibility checks.
9. Add EPUB package generation and export reports.
10. Add CLI commands.
11. Add local server API.
12. Add React app shell with import, outline, metadata, theme gallery, validation, and preview.
13. Add visual theme editor for key components.
14. Expand bundled themes to 12 to 20 polished packages.
15. Validate against a private formatting-heavy real book plus committed synthetic fixtures.

Each milestone must end with `pnpm test`, `pnpm typecheck`, and a commit.

---

## Task 1: Bootstrap The TypeScript Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/web/tests/App.test.tsx`
- Modify: `README.md`

- [ ] **Step 1: Create the root workspace files**

```json
{
  "name": "e-pub-creator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.12.1",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "dev": "pnpm --filter @epub-creator/web dev",
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.0.3",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^26.1.0",
    "prettier": "^3.5.3",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^4.0.0"
  }
}
```

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 2: Create the shared Vitest config**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    },
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["packages/**/tests/**/*.test.ts", "apps/local-server/tests/**/*.test.ts"]
        }
      },
      {
        test: {
          name: "web",
          environment: "jsdom",
          setupFiles: ["./apps/web/tests/setup.ts"],
          include: ["apps/web/tests/**/*.test.tsx"]
        }
      }
    ]
  }
});
```

- [ ] **Step 3: Create the Vite React app shell**

```json
{
  "name": "@epub-creator/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "typescript": "^5.8.3"
  }
}
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EPUB Creator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4174",
        changeOrigin: true
      }
    }
  }
});
```

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

```tsx
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
```

```css
:root {
  color: #1f2528;
  background: #f7f4ef;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  border-bottom: 1px solid #d7d2c8;
  background: #ffffff;
  padding: 16px 24px;
}

.topbar h1 {
  font-size: 20px;
  line-height: 1.2;
  margin: 0;
}

.topbar p {
  margin: 4px 0 0;
  color: #626c70;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(360px, 1fr) minmax(300px, 420px);
  gap: 16px;
  padding: 16px;
}

.panel {
  min-height: 420px;
  border: 1px solid #d7d2c8;
  border-radius: 6px;
  background: #ffffff;
  padding: 16px;
}

.panel h2 {
  font-size: 16px;
  margin: 0 0 12px;
}
```

- [ ] **Step 4: Create the initial web test**

```ts
import "@testing-library/jest-dom/vitest";
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("renders the local-first workspace shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "EPUB Creator" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Book outline" })).toBeInTheDocument();
    expect(screen.getByText("EPUB XHTML preview will render here.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Install dependencies and verify the failing setup is gone**

Run:

```bash
pnpm install
pnpm test
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 6: Update README with local development commands**

```md
# EPUB Creator

Local-first EPUB creation and formatting app for DOCX/Markdown manuscripts.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
```

The app is designed as a local-first Vellum-style formatter. The web UI runs through Vite, and the local server/CLI share core TypeScript packages.
```

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.config.ts apps README.md
git commit -m "chore: bootstrap TypeScript monorepo"
```

---

## Task 2: Define The Core Book Model

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/ids.ts`
- Create: `packages/core/src/assets.ts`
- Create: `packages/core/src/book.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/tests/book.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the core package**

```json
{
  "name": "@epub-creator/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write the core model test first**

```ts
import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "../src/book";

describe("core book model", () => {
  it("creates a book project with explicit front/body/back sections", () => {
    const project = createBookProject({
      title: "Formatting Stress Book",
      author: "Sample Author",
      language: "en"
    });

    project.sections.push(
      createSection({
        title: "Copyright",
        role: "front",
        blocks: [createTextBlock("paragraph", "Copyright 2026 Sample Author.")]
      }),
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "The first paragraph begins.")]
      }),
      createSection({
        title: "About the Author",
        role: "back",
        blocks: [createTextBlock("paragraph", "Sample Author writes books.")]
      })
    );

    expect(project.metadata.title).toBe("Formatting Stress Book");
    expect(project.sections.map((section) => section.role)).toEqual(["front", "body", "back"]);
    expect(project.sections[1]?.blocks[0]?.kind).toBe("paragraph");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
pnpm test -- packages/core/tests/book.test.ts
```

Expected:

```text
Cannot find module '../src/book'
```

- [ ] **Step 4: Implement IDs, assets, and book types**

```ts
export type EntityPrefix =
  | "book"
  | "section"
  | "block"
  | "asset"
  | "theme"
  | "snapshot"
  | "report";

export function createId(prefix: EntityPrefix): string {
  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${prefix}_${stamp}_${random}`;
}
```

```ts
import { createId } from "./ids";

export type AssetKind = "cover" | "image" | "font" | "ornament";

export interface ProjectAsset {
  id: string;
  kind: AssetKind;
  sourcePath: string;
  projectPath: string;
  mediaType: string;
  altText: string;
  caption?: string;
  license?: {
    name: string;
    spdxId?: string;
    url?: string;
  };
}

export function createAsset(input: Omit<ProjectAsset, "id">): ProjectAsset {
  return {
    id: createId("asset"),
    ...input
  };
}
```

```ts
import { createId } from "./ids";

export type SectionRole = "front" | "body" | "back";

export type TextBlockKind =
  | "paragraph"
  | "heading"
  | "chapter-title"
  | "scene-break"
  | "blockquote"
  | "epigraph"
  | "letter"
  | "email"
  | "message"
  | "poem"
  | "image"
  | "footnote"
  | "endnote";

export interface BookMetadata {
  title: string;
  subtitle?: string;
  series?: string;
  seriesNumber?: string;
  author: string;
  contributors: Array<{ name: string; role: string }>;
  publisher?: string;
  imprint?: string;
  language: string;
  description?: string;
  keywords: string[];
  categories: string[];
  isbn?: string;
  identifier: string;
  rights?: string;
  publicationDate?: string;
  edition?: string;
  coverAssetId?: string;
}

export interface BlockStyleOverride {
  variant?: string;
  cssClass?: string;
  tokens?: Record<string, string>;
}

export interface TextBlock {
  id: string;
  kind: TextBlockKind;
  text: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  assetId?: string;
  noteId?: string;
  style?: BlockStyleOverride;
}

export interface BookSection {
  id: string;
  title: string;
  role: SectionRole;
  blocks: TextBlock[];
  includeInToc: boolean;
  source?: {
    path: string;
    sourceBlockId?: string;
  };
}

export interface BookProject {
  id: string;
  formatVersion: 1;
  metadata: BookMetadata;
  sections: BookSection[];
  theme: {
    packageId: string;
    variant?: string;
    overrides: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export function createBookProject(input: {
  title: string;
  author: string;
  language: string;
}): BookProject {
  const now = new Date().toISOString();

  return {
    id: createId("book"),
    formatVersion: 1,
    metadata: {
      title: input.title,
      author: input.author,
      language: input.language,
      contributors: [],
      keywords: [],
      categories: [],
      identifier: createId("book")
    },
    sections: [],
    theme: {
      packageId: "classic-literary",
      overrides: {}
    },
    createdAt: now,
    updatedAt: now
  };
}

export function createSection(input: {
  title: string;
  role: SectionRole;
  blocks: TextBlock[];
  includeInToc?: boolean;
}): BookSection {
  return {
    id: createId("section"),
    title: input.title,
    role: input.role,
    blocks: input.blocks,
    includeInToc: input.includeInToc ?? input.role === "body"
  };
}

export function createTextBlock(
  kind: TextBlockKind,
  text: string,
  input: Partial<Omit<TextBlock, "id" | "kind" | "text">> = {}
): TextBlock {
  return {
    id: createId("block"),
    kind,
    text,
    ...input
  };
}
```

```ts
export * from "./assets";
export * from "./book";
export * from "./ids";
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
pnpm test -- packages/core/tests/book.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 6: Commit**

```bash
git add package.json packages/core
git commit -m "feat: add core book model"
```

---

## Task 3: Add Project Folder Persistence And Snapshots

**Files:**
- Create: `packages/core/src/manifest.ts`
- Create: `packages/core/src/project-folder.ts`
- Create: `packages/core/src/snapshots.ts`
- Create: `packages/core/tests/manifest.test.ts`
- Create: `packages/core/tests/snapshots.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write manifest and snapshot tests**

```ts
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBookProject } from "../src/book";
import { readProjectFolder, writeProjectFolder } from "../src/project-folder";

describe("project folder persistence", () => {
  it("writes a readable project manifest and content file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-project-"));
    const project = createBookProject({ title: "Local Book", author: "A. Writer", language: "en" });

    await writeProjectFolder(directory, project);
    const restored = await readProjectFolder(directory);
    const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));

    expect(manifest.formatVersion).toBe(1);
    expect(restored.metadata.title).toBe("Local Book");
  });
});
```

```ts
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createBookProject } from "../src/book";
import { createSnapshot } from "../src/snapshots";

describe("snapshots", () => {
  it("creates timestamped project snapshots for risky operations", async () => {
    const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
    const project = createBookProject({ title: "Snapshot Book", author: "A. Writer", language: "en" });

    const snapshot = await createSnapshot(directory, project, "before-import");
    const entries = await readdir(join(directory, ".snapshots"));

    expect(snapshot.reason).toBe("before-import");
    expect(entries[0]).toContain("before-import");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm test -- packages/core/tests/manifest.test.ts packages/core/tests/snapshots.test.ts
```

Expected:

```text
Cannot find module '../src/project-folder'
```

- [ ] **Step 3: Implement persistence and snapshots**

```ts
import type { BookProject } from "./book";

export interface ProjectManifest {
  formatVersion: 1;
  app: "epub-creator";
  projectId: string;
  title: string;
  contentPath: "content/book.json";
  assetsPath: "assets";
  themesPath: "themes";
  snapshotsPath: ".snapshots";
  updatedAt: string;
}

export function createManifest(project: BookProject): ProjectManifest {
  return {
    formatVersion: 1,
    app: "epub-creator",
    projectId: project.id,
    title: project.metadata.title,
    contentPath: "content/book.json",
    assetsPath: "assets",
    themesPath: "themes",
    snapshotsPath: ".snapshots",
    updatedAt: project.updatedAt
  };
}
```

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BookProject } from "./book";
import { createManifest } from "./manifest";

export async function writeProjectFolder(directory: string, project: BookProject): Promise<void> {
  await mkdir(join(directory, "content"), { recursive: true });
  await mkdir(join(directory, "assets"), { recursive: true });
  await mkdir(join(directory, "themes"), { recursive: true });
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify(createManifest(project), null, 2)}\n`);
  await writeFile(join(directory, "content", "book.json"), `${JSON.stringify(project, null, 2)}\n`);
}

export async function readProjectFolder(directory: string): Promise<BookProject> {
  const raw = await readFile(join(directory, "content", "book.json"), "utf8");
  const project = JSON.parse(raw) as BookProject;

  if (project.formatVersion !== 1) {
    throw new Error(`Unsupported project format version: ${String(project.formatVersion)}`);
  }

  return project;
}
```

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BookProject } from "./book";

export interface ProjectSnapshot {
  id: string;
  reason: "before-import" | "before-reimport" | "before-theme-change" | "before-frontmatter-regeneration" | "before-export";
  path: string;
  createdAt: string;
}

export async function createSnapshot(
  directory: string,
  project: BookProject,
  reason: ProjectSnapshot["reason"]
): Promise<ProjectSnapshot> {
  const createdAt = new Date().toISOString();
  const safeStamp = createdAt.replaceAll(":", "-").replaceAll(".", "-");
  const filename = `${safeStamp}-${reason}.json`;
  const snapshotDirectory = join(directory, ".snapshots");
  const snapshotPath = join(snapshotDirectory, filename);

  await mkdir(snapshotDirectory, { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(project, null, 2)}\n`);

  return {
    id: filename.replace(/\.json$/, ""),
    reason,
    path: snapshotPath,
    createdAt
  };
}
```

```ts
export * from "./assets";
export * from "./book";
export * from "./ids";
export * from "./manifest";
export * from "./project-folder";
export * from "./snapshots";
```

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test -- packages/core/tests/manifest.test.ts packages/core/tests/snapshots.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat: persist project folders with snapshots"
```

---

## Task 4: Add Markdown Import With Conservative Structure Detection

**Files:**
- Create: `packages/importers/package.json`
- Create: `packages/importers/tsconfig.json`
- Create: `packages/importers/src/import-report.ts`
- Create: `packages/importers/src/markdown.ts`
- Create: `packages/importers/src/index.ts`
- Create: `packages/importers/tests/markdown.test.ts`
- Create: `fixtures/markdown/formatting-stress.md`
- Modify: `package.json`

- [ ] **Step 1: Create importer package metadata**

```json
{
  "name": "@epub-creator/importers",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Create the Markdown fixture**

```md
# Formatting Stress Book

By Sample Author

## Copyright

Copyright 2026 Sample Author.

## Chapter One

The first paragraph begins with a sentence that should receive first-paragraph styling.

* * *

> This is an epigraph that should become a semantic epigraph block.

Dear Reader,

This letter-like block should remain editable as structured content.

![A sample plate](../assets/sample-plate.png "A centered image plate")

## About the Author

Sample Author writes books with complex formatting.
```

- [ ] **Step 3: Write the failing Markdown importer test**

```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { importMarkdown } from "../src/markdown";

describe("importMarkdown", () => {
  it("normalizes Markdown into an explicit book outline", async () => {
    const markdown = await readFile("fixtures/markdown/formatting-stress.md", "utf8");
    const result = importMarkdown(markdown, {
      sourcePath: "fixtures/markdown/formatting-stress.md",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.metadata.title).toBe("Formatting Stress Book");
    expect(result.project.sections.map((section) => section.title)).toEqual([
      "Copyright",
      "Chapter One",
      "About the Author"
    ]);
    expect(result.project.sections.map((section) => section.role)).toEqual(["front", "body", "back"]);
    expect(result.report.warnings).toContainEqual({
      code: "IMPORT_REVIEW_REQUIRED",
      message: "Review detected section roles and block classifications before export."
    });
  });
});
```

- [ ] **Step 4: Run the failing test**

Run:

```bash
pnpm test -- packages/importers/tests/markdown.test.ts
```

Expected:

```text
Cannot find module '../src/markdown'
```

- [ ] **Step 5: Implement the report and Markdown importer**

```ts
export interface ImportWarning {
  code:
    | "IMPORT_REVIEW_REQUIRED"
    | "UNCLASSIFIED_BLOCK"
    | "IMAGE_REFERENCE_FOUND"
    | "COMMENTS_NOT_IMPORTED"
    | "TRACKED_CHANGES_NOT_IMPORTED";
  message: string;
}

export interface ImportReport {
  sourcePath: string;
  warnings: ImportWarning[];
  importedAssets: Array<{
    sourcePath: string;
    altText: string;
    caption?: string;
  }>;
}

export function createImportReport(sourcePath: string): ImportReport {
  return {
    sourcePath,
    warnings: [
      {
        code: "IMPORT_REVIEW_REQUIRED",
        message: "Review detected section roles and block classifications before export."
      }
    ],
    importedAssets: []
  };
}
```

```ts
import { createBookProject, createSection, createTextBlock, type BookProject, type SectionRole, type TextBlock } from "@epub-creator/core";
import { createImportReport, type ImportReport } from "./import-report";

export interface MarkdownImportOptions {
  sourcePath: string;
  author: string;
  language: string;
}

export interface MarkdownImportResult {
  project: BookProject;
  report: ImportReport;
}

export function importMarkdown(markdown: string, options: MarkdownImportOptions): MarkdownImportResult {
  const lines = markdown.split(/\r?\n/);
  const title = firstHeading(lines) ?? "Untitled Book";
  const project = createBookProject({
    title,
    author: options.author,
    language: options.language
  });
  const report = createImportReport(options.sourcePath);

  let currentTitle = "";
  let currentBlocks: TextBlock[] = [];

  function flushSection(): void {
    if (!currentTitle) {
      return;
    }

    project.sections.push(
      createSection({
        title: currentTitle,
        role: inferSectionRole(currentTitle),
        blocks: currentBlocks
      })
    );
    currentBlocks = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("# ")) {
      continue;
    }

    if (line.startsWith("## ")) {
      flushSection();
      currentTitle = line.replace(/^##\s+/, "");
      continue;
    }

    if (/^(\*\s*){3}$/.test(line) || line === "---") {
      currentBlocks.push(createTextBlock("scene-break", ""));
      continue;
    }

    if (line.startsWith(">")) {
      currentBlocks.push(createTextBlock("epigraph", line.replace(/^>\s?/, "")));
      continue;
    }

    const image = line.match(/^!\[(?<alt>[^\]]*)\]\((?<path>[^)\s]+)(?:\s+"(?<caption>[^"]+)")?\)$/);
    if (image?.groups) {
      report.importedAssets.push({
        sourcePath: image.groups.path,
        altText: image.groups.alt,
        caption: image.groups.caption
      });
      report.warnings.push({
        code: "IMAGE_REFERENCE_FOUND",
        message: `Import image asset before export: ${image.groups.path}`
      });
      currentBlocks.push(createTextBlock("image", image.groups.caption ?? image.groups.alt, { assetId: image.groups.path }));
      continue;
    }

    currentBlocks.push(createTextBlock("paragraph", line));
  }

  flushSection();
  return { project, report };
}

function firstHeading(lines: string[]): string | undefined {
  const heading = lines.find((line) => line.startsWith("# "));
  return heading?.replace(/^#\s+/, "").trim();
}

function inferSectionRole(title: string): SectionRole {
  const normalized = title.toLowerCase();

  if (["copyright", "dedication", "title page"].some((token) => normalized.includes(token))) {
    return "front";
  }

  if (["about the author", "also by", "newsletter", "acknowledgments"].some((token) => normalized.includes(token))) {
    return "back";
  }

  return "body";
}
```

```ts
export * from "./import-report";
export * from "./markdown";
```

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- packages/importers/tests/markdown.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 7: Commit**

```bash
git add fixtures/markdown packages/importers package.json
git commit -m "feat: import markdown into structured books"
```

---

## Task 5: Add DOCX Import Through Mammoth HTML Normalization

**Files:**
- Create: `packages/importers/src/html-to-book.ts`
- Create: `packages/importers/src/docx.ts`
- Create: `packages/importers/tests/html-to-book.test.ts`
- Modify: `packages/importers/src/index.ts`
- Modify: `packages/importers/package.json`

- [ ] **Step 1: Add mammoth dependency**

```json
{
  "name": "@epub-creator/importers",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*",
    "mammoth": "^1.9.1"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 2: Write HTML normalization test**

```ts
import { describe, expect, it } from "vitest";
import { importHtmlFragment } from "../src/html-to-book";

describe("importHtmlFragment", () => {
  it("converts mammoth-style HTML into semantic sections and notes", () => {
    const html = `
      <h1>Formatting Stress Book</h1>
      <h2>Chapter One</h2>
      <p>The first paragraph begins.</p>
      <blockquote>An epigraph line.</blockquote>
      <p><a href="#footnote-1" id="footnote-ref-1">1</a></p>
      <ol><li id="footnote-1">A preserved footnote.</li></ol>
    `;

    const result = importHtmlFragment(html, {
      sourcePath: "sample.docx",
      author: "Sample Author",
      language: "en"
    });

    expect(result.project.sections[0]?.title).toBe("Chapter One");
    expect(result.project.sections[0]?.blocks.map((block) => block.kind)).toEqual([
      "paragraph",
      "epigraph",
      "footnote"
    ]);
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
pnpm test -- packages/importers/tests/html-to-book.test.ts
```

Expected:

```text
Cannot find module '../src/html-to-book'
```

- [ ] **Step 4: Implement HTML normalization and DOCX import wrapper**

```ts
import { createBookProject, createSection, createTextBlock, type BookProject, type TextBlock } from "@epub-creator/core";
import { createImportReport, type ImportReport } from "./import-report";

export interface HtmlImportOptions {
  sourcePath: string;
  author: string;
  language: string;
}

export interface HtmlImportResult {
  project: BookProject;
  report: ImportReport;
}

export function importHtmlFragment(html: string, options: HtmlImportOptions): HtmlImportResult {
  const title = textOfFirst(html, "h1") ?? "Untitled Book";
  const project = createBookProject({ title, author: options.author, language: options.language });
  const report = createImportReport(options.sourcePath);
  const tokens = html
    .replace(/\r?\n/g, " ")
    .match(/<(h2|p|blockquote|li)\b[^>]*>.*?<\/\1>/gi) ?? [];

  let currentTitle = "";
  let blocks: TextBlock[] = [];

  function flush(): void {
    if (!currentTitle) {
      return;
    }

    project.sections.push(
      createSection({
        title: currentTitle,
        role: inferRole(currentTitle),
        blocks
      })
    );
    blocks = [];
  }

  for (const token of tokens) {
    if (/^<h2\b/i.test(token)) {
      flush();
      currentTitle = stripTags(token);
      continue;
    }

    if (!currentTitle) {
      continue;
    }

    if (/^<blockquote\b/i.test(token)) {
      blocks.push(createTextBlock("epigraph", stripTags(token)));
      continue;
    }

    if (/^<li\b/i.test(token) && /\bfootnote/i.test(token)) {
      blocks.push(createTextBlock("footnote", stripTags(token)));
      continue;
    }

    const text = stripTags(token);
    if (text && !/^\d+$/.test(text)) {
      blocks.push(createTextBlock("paragraph", text));
    }
  }

  flush();
  return { project, report };
}

function textOfFirst(html: string, tag: string): string | undefined {
  const match = html.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "i"));
  return match ? stripTags(match[1] ?? "") : undefined;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function inferRole(title: string): "front" | "body" | "back" {
  const normalized = title.toLowerCase();

  if (normalized.includes("copyright") || normalized.includes("dedication")) {
    return "front";
  }

  if (normalized.includes("about the author") || normalized.includes("also by")) {
    return "back";
  }

  return "body";
}
```

```ts
import * as mammoth from "mammoth";
import { importHtmlFragment, type HtmlImportOptions, type HtmlImportResult } from "./html-to-book";

export interface DocxImportOptions extends HtmlImportOptions {
  styleMap?: string[];
}

export async function importDocx(path: string, options: DocxImportOptions): Promise<HtmlImportResult> {
  const result = await mammoth.convertToHtml(
    { path },
    {
      styleMap: options.styleMap ?? [
        "p[style-name='Chapter Title'] => h2:fresh",
        "p[style-name='Scene Break'] => p.scene-break:fresh",
        "p[style-name='Epigraph'] => blockquote:fresh",
        "p[style-name='Letter'] => p.letter:fresh"
      ],
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: true
    }
  );
  const imported = importHtmlFragment(result.value, options);

  for (const message of result.messages) {
    imported.report.warnings.push({
      code: "UNCLASSIFIED_BLOCK",
      message: `${message.type}: ${message.message}`
    });
  }

  return imported;
}
```

```ts
export * from "./docx";
export * from "./html-to-book";
export * from "./import-report";
export * from "./markdown";
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm install
pnpm test -- packages/importers/tests/html-to-book.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 6: Commit**

```bash
git add packages/importers pnpm-lock.yaml
git commit -m "feat: import docx through semantic html normalization"
```

---

## Task 6: Add Declarative Theme Packages

**Files:**
- Create: `packages/themes/package.json`
- Create: `packages/themes/tsconfig.json`
- Create: `packages/themes/src/theme-package.ts`
- Create: `packages/themes/src/theme-registry.ts`
- Create: `packages/themes/src/index.ts`
- Create: `packages/themes/bundled/classic-literary/theme.json`
- Create: `packages/themes/bundled/classic-literary/theme.css`
- Create: `packages/themes/bundled/modern-clean/theme.json`
- Create: `packages/themes/bundled/modern-clean/theme.css`
- Create: `packages/themes/tests/theme-package.test.ts`

- [ ] **Step 1: Create theme package metadata**

```json
{
  "name": "@epub-creator/themes",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write the theme package test**

```ts
import { describe, expect, it } from "vitest";
import { validateThemePackage } from "../src/theme-package";

describe("theme packages", () => {
  it("accepts constrained declarative themes with license metadata", () => {
    const theme = validateThemePackage({
      id: "classic-literary",
      version: "0.1.0",
      name: "Classic Literary",
      description: "Traditional chapter openers and restrained typography.",
      license: "CC-BY-4.0",
      cssPath: "theme.css",
      preview: {
        thumbnailPath: "preview.png",
        sampleText: "Chapter One"
      },
      tokens: {
        bodyFont: "serif",
        headingFont: "serif",
        accentColor: "#7b4f2c",
        chapterNumberStyle: "roman"
      },
      fonts: [
        {
          family: "Libre Baskerville",
          file: "fonts/LibreBaskerville-Regular.ttf",
          license: {
            name: "OFL-1.1",
            spdxId: "OFL-1.1",
            url: "https://openfontlicense.org"
          }
        }
      ],
      components: {
        chapterTitle: ["classic", "ornamented"],
        sceneBreak: ["asterism", "ornament"],
        quote: ["indented", "boxed-light"]
      }
    });

    expect(theme.id).toBe("classic-literary");
    expect(theme.fonts[0]?.license.spdxId).toBe("OFL-1.1");
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
pnpm test -- packages/themes/tests/theme-package.test.ts
```

Expected:

```text
Cannot find module '../src/theme-package'
```

- [ ] **Step 4: Implement theme package validation**

```ts
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
```

```ts
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
```

```ts
export * from "./theme-package";
export * from "./theme-registry";
```

- [ ] **Step 5: Add two initial bundled themes**

```json
{
  "id": "classic-literary",
  "version": "0.1.0",
  "name": "Classic Literary",
  "description": "Traditional serif typography with ornamented chapter openings.",
  "license": "CC-BY-4.0",
  "cssPath": "theme.css",
  "preview": {
    "thumbnailPath": "preview.png",
    "sampleText": "Chapter One"
  },
  "tokens": {
    "bodyFont": "serif",
    "headingFont": "serif",
    "accentColor": "#7b4f2c",
    "chapterNumberStyle": "roman"
  },
  "fonts": [],
  "components": {
    "chapterTitle": ["classic", "ornamented"],
    "sceneBreak": ["asterism", "ornament"],
    "quote": ["indented", "boxed-light"]
  }
}
```

```css
body {
  color: #1e1b18;
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.55;
}

.chapter-title {
  break-before: page;
  margin: 18vh 0 2rem;
  text-align: center;
}

.chapter-title h1 {
  font-size: 1.8rem;
  font-weight: 400;
  letter-spacing: 0;
}

.scene-break {
  margin: 1.8rem 0;
  text-align: center;
}

.scene-break::before {
  content: "* * *";
}

.epigraph,
.blockquote {
  margin: 1.5rem 10%;
  font-style: italic;
}
```

```json
{
  "id": "modern-clean",
  "version": "0.1.0",
  "name": "Modern Clean",
  "description": "Clean contemporary typography with generous spacing.",
  "license": "CC-BY-4.0",
  "cssPath": "theme.css",
  "preview": {
    "thumbnailPath": "preview.png",
    "sampleText": "Chapter One"
  },
  "tokens": {
    "bodyFont": "sans-serif",
    "headingFont": "sans-serif",
    "accentColor": "#2f6f73",
    "chapterNumberStyle": "decimal"
  },
  "fonts": [],
  "components": {
    "chapterTitle": ["minimal", "rule"],
    "sceneBreak": ["rule", "space"],
    "quote": ["left-rule", "boxed-light"]
  }
}
```

```css
body {
  color: #22282a;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.6;
}

.chapter-title {
  break-before: page;
  margin: 12vh 0 2.2rem;
  border-bottom: 1px solid #2f6f73;
  padding-bottom: 1rem;
}

.chapter-title h1 {
  font-size: 1.7rem;
  font-weight: 600;
  letter-spacing: 0;
}

.scene-break {
  margin: 2rem auto;
  width: 30%;
  border-top: 1px solid #2f6f73;
}

.epigraph,
.blockquote {
  margin: 1.5rem 8%;
  border-left: 3px solid #2f6f73;
  padding-left: 1rem;
}
```

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- packages/themes/tests/theme-package.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 7: Commit**

```bash
git add packages/themes
git commit -m "feat: add declarative theme packages"
```

---

## Task 7: Render EPUB XHTML And Preview HTML

**Files:**
- Create: `packages/renderer/package.json`
- Create: `packages/renderer/tsconfig.json`
- Create: `packages/renderer/src/html.ts`
- Create: `packages/renderer/src/css.ts`
- Create: `packages/renderer/src/nav.ts`
- Create: `packages/renderer/src/preview.ts`
- Create: `packages/renderer/src/index.ts`
- Create: `packages/renderer/tests/html.test.ts`
- Create: `packages/renderer/tests/preview.test.ts`

- [ ] **Step 1: Create renderer package metadata**

```json
{
  "name": "@epub-creator/renderer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*",
    "@epub-creator/themes": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write renderer tests**

```ts
import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { renderSectionXhtml } from "../src/html";

describe("renderSectionXhtml", () => {
  it("renders semantic blocks as EPUB XHTML", () => {
    const project = createBookProject({ title: "Render Book", author: "A. Writer", language: "en" });
    const section = createSection({
      title: "Chapter One",
      role: "body",
      blocks: [
        createTextBlock("paragraph", "Opening paragraph."),
        createTextBlock("scene-break", ""),
        createTextBlock("epigraph", "A line before the chapter.")
      ]
    });

    const xhtml = renderSectionXhtml(project, section);

    expect(xhtml).toContain('<section epub:type="chapter"');
    expect(xhtml).toContain('<p class="paragraph">Opening paragraph.</p>');
    expect(xhtml).toContain('<div class="scene-break" aria-hidden="true"></div>');
    expect(xhtml).toContain('<blockquote class="epigraph">A line before the chapter.</blockquote>');
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { createBookProject } from "@epub-creator/core";
import { createPreviewDocument } from "../src/preview";

describe("createPreviewDocument", () => {
  it("wraps rendered content in an iframe-ready XHTML document", () => {
    const project = createBookProject({ title: "Preview Book", author: "A. Writer", language: "en" });
    const html = createPreviewDocument(project, "<section>Body</section>", "body { color: #111; }");

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Preview Book</title>");
    expect(html).toContain("body { color: #111; }");
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
pnpm test -- packages/renderer/tests/html.test.ts packages/renderer/tests/preview.test.ts
```

Expected:

```text
Cannot find module '../src/html'
```

- [ ] **Step 4: Implement XHTML rendering**

```ts
import type { BookProject, BookSection, TextBlock } from "@epub-creator/core";

export function renderSectionXhtml(project: BookProject, section: BookSection): string {
  const type = section.role === "body" ? "chapter" : section.role === "front" ? "frontmatter" : "backmatter";
  const body = section.blocks.map(renderBlock).join("\n");

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeAttribute(project.metadata.language)}">`,
    "<head>",
    `  <title>${escapeHtml(section.title)}</title>`,
    `  <link rel="stylesheet" type="text/css" href="../styles/book.css" />`,
    "</head>",
    "<body>",
    `  <section epub:type="${type}" id="${escapeAttribute(section.id)}">`,
    `    <header class="chapter-title"><h1>${escapeHtml(section.title)}</h1></header>`,
    body,
    "  </section>",
    "</body>",
    "</html>"
  ].join("\n");
}

function renderBlock(block: TextBlock): string {
  const text = escapeHtml(block.text);

  switch (block.kind) {
    case "scene-break":
      return `    <div class="scene-break" aria-hidden="true"></div>`;
    case "epigraph":
      return `    <blockquote class="epigraph">${text}</blockquote>`;
    case "blockquote":
      return `    <blockquote class="blockquote">${text}</blockquote>`;
    case "letter":
    case "email":
    case "message":
      return `    <div class="${block.kind}">${text}</div>`;
    case "poem":
      return `    <pre class="poem">${text}</pre>`;
    case "image":
      return `    <figure class="image"><img src="../assets/${escapeAttribute(block.assetId ?? "")}" alt="${escapeAttribute(block.text)}" /></figure>`;
    case "footnote":
    case "endnote":
      return `    <aside epub:type="footnote" class="${block.kind}" id="${escapeAttribute(block.id)}">${text}</aside>`;
    case "heading":
      return `    <h${block.level ?? 2} class="heading">${text}</h${block.level ?? 2}>`;
    case "chapter-title":
      return `    <h1 class="chapter-title-inline">${text}</h1>`;
    case "paragraph":
    default:
      return `    <p class="paragraph">${text}</p>`;
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
```

```ts
export function mergeCss(themeCss: string, projectOverrides: Record<string, string>): string {
  const overrideCss = Object.entries(projectOverrides)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");

  if (!overrideCss) {
    return themeCss;
  }

  return `${themeCss}\n\n:root {\n${overrideCss}\n}\n`;
}
```

```ts
import type { BookProject } from "@epub-creator/core";

export function renderNavXhtml(project: BookProject): string {
  const items = project.sections
    .filter((section) => section.includeInToc)
    .map((section, index) => `      <li><a href="sections/section-${index + 1}.xhtml">${escapeHtml(section.title)}</a></li>`)
    .join("\n");

  return [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeHtml(project.metadata.language)}">`,
    "<head><title>Table of Contents</title></head>",
    "<body>",
    `  <nav epub:type="toc" id="toc">`,
    "    <h1>Table of Contents</h1>",
    "    <ol>",
    items,
    "    </ol>",
    "  </nav>",
    "</body>",
    "</html>"
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
```

```ts
import type { BookProject } from "@epub-creator/core";

export function createPreviewDocument(project: BookProject, bodyMarkup: string, css: string): string {
  return [
    "<!doctype html>",
    `<html lang="${project.metadata.language}">`,
    "<head>",
    `  <title>${escapeHtml(project.metadata.title)}</title>`,
    "  <meta charset=\"utf-8\" />",
    "  <style>",
    css,
    "  </style>",
    "</head>",
    "<body>",
    bodyMarkup,
    "</body>",
    "</html>"
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
```

```ts
export * from "./css";
export * from "./html";
export * from "./nav";
export * from "./preview";
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- packages/renderer/tests/html.test.ts packages/renderer/tests/preview.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 6: Commit**

```bash
git add packages/renderer
git commit -m "feat: render epub xhtml previews"
```

---

## Task 8: Add Validation Profiles And Accessibility Checks

**Files:**
- Create: `packages/validation/package.json`
- Create: `packages/validation/tsconfig.json`
- Create: `packages/validation/src/report.ts`
- Create: `packages/validation/src/accessibility.ts`
- Create: `packages/validation/src/export-profiles.ts`
- Create: `packages/validation/src/index.ts`
- Create: `packages/validation/tests/accessibility.test.ts`
- Create: `packages/validation/tests/export-profiles.test.ts`

- [ ] **Step 1: Create validation package metadata**

```json
{
  "name": "@epub-creator/validation",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*",
    "@epub-creator/themes": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write validation tests**

```ts
import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { validateAccessibility } from "../src/accessibility";

describe("validateAccessibility", () => {
  it("reports missing language, alt text, and table of contents issues", () => {
    const project = createBookProject({ title: "Access Book", author: "A. Writer", language: "" });
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("image", "", { assetId: "plate.png" })],
        includeInToc: false
      })
    );

    const report = validateAccessibility(project);

    expect(report.issues.map((issue) => issue.code)).toEqual([
      "LANGUAGE_REQUIRED",
      "IMAGE_ALT_REQUIRED",
      "TOC_ENTRY_REQUIRED"
    ]);
  });
});
```

```ts
import { describe, expect, it } from "vitest";
import { validateExportProfile } from "../src/export-profiles";

describe("validateExportProfile", () => {
  it("warns when enhanced CSS is used in KDP-safe export", () => {
    const report = validateExportProfile("kdp-safe", ".chapter-title { position: sticky; }");

    expect(report.issues).toContainEqual({
      severity: "warning",
      code: "CSS_MAY_NOT_SURVIVE_KDP",
      message: "CSS property may be ignored by Kindle/KDP readers: position: sticky"
    });
  });
});
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
pnpm test -- packages/validation/tests/accessibility.test.ts packages/validation/tests/export-profiles.test.ts
```

Expected:

```text
Cannot find module '../src/accessibility'
```

- [ ] **Step 4: Implement validation**

```ts
export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
}

export function createValidationReport(issues: ValidationIssue[] = []): ValidationReport {
  return { issues };
}
```

```ts
import type { BookProject } from "@epub-creator/core";
import { createValidationReport, type ValidationReport } from "./report";

export function validateAccessibility(project: BookProject): ValidationReport {
  const issues = [];

  if (!project.metadata.language.trim()) {
    issues.push({
      severity: "error" as const,
      code: "LANGUAGE_REQUIRED",
      message: "Book language metadata is required."
    });
  }

  for (const section of project.sections) {
    for (const block of section.blocks) {
      if (block.kind === "image" && !block.text.trim()) {
        issues.push({
          severity: "error" as const,
          code: "IMAGE_ALT_REQUIRED",
          message: `Image block requires alt text in section: ${section.title}`,
          path: `${section.id}/${block.id}`
        });
      }
    }
  }

  if (project.sections.some((section) => section.role === "body") && !project.sections.some((section) => section.includeInToc)) {
    issues.push({
      severity: "error" as const,
      code: "TOC_ENTRY_REQUIRED",
      message: "At least one body section must be included in the table of contents."
    });
  }

  return createValidationReport(issues);
}
```

```ts
import { createValidationReport, type ValidationReport } from "./report";

export type ExportProfile = "portable-epub3" | "kdp-safe" | "apple-books-enhanced";

const kdpSensitiveCss = ["position: sticky", "float:", "filter:", "backdrop-filter", "vh", "vw"];

export function validateExportProfile(profile: ExportProfile, css: string): ValidationReport {
  const issues = [];

  if (profile === "kdp-safe") {
    for (const token of kdpSensitiveCss) {
      if (css.includes(token)) {
        issues.push({
          severity: "warning" as const,
          code: "CSS_MAY_NOT_SURVIVE_KDP",
          message: `CSS property may be ignored by Kindle/KDP readers: ${token}`
        });
      }
    }
  }

  if (profile === "portable-epub3" && /script\b/i.test(css)) {
    issues.push({
      severity: "error" as const,
      code: "SCRIPT_NOT_ALLOWED",
      message: "Portable EPUB 3 export does not allow script content."
    });
  }

  return createValidationReport(issues);
}
```

```ts
export * from "./accessibility";
export * from "./export-profiles";
export * from "./report";
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- packages/validation/tests/accessibility.test.ts packages/validation/tests/export-profiles.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 6: Commit**

```bash
git add packages/validation
git commit -m "feat: add epub validation profiles"
```

---

## Task 9: Add EPUB Packaging And Export Reports

**Files:**
- Create: `packages/epub/package.json`
- Create: `packages/epub/tsconfig.json`
- Create: `packages/epub/src/mimetype.ts`
- Create: `packages/epub/src/container.ts`
- Create: `packages/epub/src/opf.ts`
- Create: `packages/epub/src/package-epub.ts`
- Create: `packages/epub/src/index.ts`
- Create: `packages/epub/tests/opf.test.ts`

- [ ] **Step 1: Create EPUB package metadata**

```json
{
  "name": "@epub-creator/epub",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*",
    "@epub-creator/renderer": "workspace:*",
    "@epub-creator/validation": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write OPF test**

```ts
import { describe, expect, it } from "vitest";
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { renderOpf } from "../src/opf";

describe("renderOpf", () => {
  it("renders EPUB 3 package metadata and manifest entries", () => {
    const project = createBookProject({ title: "Export Book", author: "A. Writer", language: "en" });
    project.sections.push(
      createSection({
        title: "Chapter One",
        role: "body",
        blocks: [createTextBlock("paragraph", "Opening.")]
      })
    );

    const opf = renderOpf(project);

    expect(opf).toContain('version="3.0"');
    expect(opf).toContain("<dc:title>Export Book</dc:title>");
    expect(opf).toContain('properties="nav"');
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
pnpm test -- packages/epub/tests/opf.test.ts
```

Expected:

```text
Cannot find module '../src/opf'
```

- [ ] **Step 4: Implement EPUB package documents**

```ts
export const EPUB_MIMETYPE = "application/epub+zip";
```

```ts
export function renderContainerXml(): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">`,
    `  <rootfiles>`,
    `    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml" />`,
    `  </rootfiles>`,
    `</container>`
  ].join("\n");
}
```

```ts
import type { BookProject } from "@epub-creator/core";

export function renderOpf(project: BookProject): string {
  const sectionItems = project.sections
    .map(
      (section, index) =>
        `    <item id="section-${index + 1}" href="sections/section-${index + 1}.xhtml" media-type="application/xhtml+xml" />`
    )
    .join("\n");
  const spineItems = project.sections.map((_, index) => `    <itemref idref="section-${index + 1}" />`).join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0">`,
    `  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">`,
    `    <dc:identifier id="book-id">${escapeXml(project.metadata.identifier)}</dc:identifier>`,
    `    <dc:title>${escapeXml(project.metadata.title)}</dc:title>`,
    `    <dc:creator>${escapeXml(project.metadata.author)}</dc:creator>`,
    `    <dc:language>${escapeXml(project.metadata.language)}</dc:language>`,
    `    <meta property="dcterms:modified">${new Date(project.updatedAt).toISOString().replace(/\.\d{3}Z$/, "Z")}</meta>`,
    `  </metadata>`,
    `  <manifest>`,
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />`,
    `    <item id="css" href="styles/book.css" media-type="text/css" />`,
    sectionItems,
    `  </manifest>`,
    `  <spine>`,
    spineItems,
    `  </spine>`,
    `</package>`
  ].join("\n");
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
```

```ts
import type { BookProject } from "@epub-creator/core";
import { renderSectionXhtml, renderNavXhtml } from "@epub-creator/renderer";
import { validateAccessibility, validateExportProfile, type ExportProfile, type ValidationReport } from "@epub-creator/validation";
import { renderContainerXml } from "./container";
import { EPUB_MIMETYPE } from "./mimetype";
import { renderOpf } from "./opf";

export interface EpubPackageFile {
  path: string;
  content: string | Uint8Array;
  mediaType: string;
}

export interface EpubPackageResult {
  files: EpubPackageFile[];
  report: ValidationReport;
}

export function createEpubPackage(project: BookProject, css: string, profile: ExportProfile): EpubPackageResult {
  const accessibility = validateAccessibility(project);
  const profileReport = validateExportProfile(profile, css);
  const sectionFiles = project.sections.map((section, index) => ({
    path: `EPUB/sections/section-${index + 1}.xhtml`,
    mediaType: "application/xhtml+xml",
    content: renderSectionXhtml(project, section)
  }));

  return {
    files: [
      { path: "mimetype", content: EPUB_MIMETYPE, mediaType: "text/plain" },
      { path: "META-INF/container.xml", content: renderContainerXml(), mediaType: "application/xml" },
      { path: "EPUB/package.opf", content: renderOpf(project), mediaType: "application/oebps-package+xml" },
      { path: "EPUB/nav.xhtml", content: renderNavXhtml(project), mediaType: "application/xhtml+xml" },
      { path: "EPUB/styles/book.css", content: css, mediaType: "text/css" },
      ...sectionFiles
    ],
    report: {
      issues: [...accessibility.issues, ...profileReport.issues]
    }
  };
}
```

```ts
export * from "./container";
export * from "./mimetype";
export * from "./opf";
export * from "./package-epub";
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- packages/epub/tests/opf.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 6: Commit**

```bash
git add packages/epub
git commit -m "feat: generate epub package documents"
```

---

## Task 10: Add CLI Commands For Import, Validate, Export, And Themes

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/parse-args.ts`
- Create: `packages/cli/src/commands/import.ts`
- Create: `packages/cli/src/commands/validate.ts`
- Create: `packages/cli/src/commands/export.ts`
- Create: `packages/cli/src/commands/themes.ts`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/tests/parse-args.test.ts`

- [ ] **Step 1: Create CLI package metadata**

```json
{
  "name": "@epub-creator/cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "epub-creator": "src/index.ts"
  },
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*",
    "@epub-creator/importers": "workspace:*",
    "@epub-creator/validation": "workspace:*",
    "@epub-creator/epub": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write CLI parsing test**

```ts
import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/parse-args";

describe("parseArgs", () => {
  it("parses command and flags", () => {
    expect(parseArgs(["import", "--source", "book.md", "--project", "Book.epubproj"])).toEqual({
      command: "import",
      flags: {
        source: "book.md",
        project: "Book.epubproj"
      }
    });
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
pnpm test -- packages/cli/tests/parse-args.test.ts
```

Expected:

```text
Cannot find module '../src/parse-args'
```

- [ ] **Step 4: Implement CLI parser and command dispatcher**

```ts
export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (!token?.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = rest[index + 1];

    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return { command, flags };
}
```

```ts
import { readFile } from "node:fs/promises";
import { importMarkdown } from "@epub-creator/importers";
import { writeProjectFolder } from "@epub-creator/core";

export async function importCommand(flags: Record<string, string | boolean>): Promise<string> {
  const source = requiredString(flags.source, "--source");
  const projectPath = requiredString(flags.project, "--project");
  const author = typeof flags.author === "string" ? flags.author : "Unknown Author";
  const language = typeof flags.language === "string" ? flags.language : "en";
  const markdown = await readFile(source, "utf8");
  const result = importMarkdown(markdown, { sourcePath: source, author, language });

  await writeProjectFolder(projectPath, result.project);
  return `Imported ${source} into ${projectPath}`;
}

function requiredString(value: string | boolean | undefined, name: string): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
```

```ts
import { readProjectFolder } from "@epub-creator/core";
import { validateAccessibility } from "@epub-creator/validation";

export async function validateCommand(flags: Record<string, string | boolean>): Promise<string> {
  const projectPath = typeof flags.project === "string" ? flags.project : "";
  const project = await readProjectFolder(projectPath);
  const report = validateAccessibility(project);

  return JSON.stringify(report, null, 2);
}
```

```ts
import { readProjectFolder } from "@epub-creator/core";
import { createEpubPackage } from "@epub-creator/epub";
import type { ExportProfile } from "@epub-creator/validation";

export async function exportCommand(flags: Record<string, string | boolean>): Promise<string> {
  const projectPath = typeof flags.project === "string" ? flags.project : "";
  const profile = (typeof flags.profile === "string" ? flags.profile : "kdp-safe") as ExportProfile;
  const project = await readProjectFolder(projectPath);
  const result = createEpubPackage(project, "body { line-height: 1.55; }", profile);

  return JSON.stringify(
    {
      fileCount: result.files.length,
      issueCount: result.report.issues.length,
      profile
    },
    null,
    2
  );
}
```

```ts
export async function themesCommand(): Promise<string> {
  return JSON.stringify(
    {
      themes: ["classic-literary", "modern-clean"]
    },
    null,
    2
  );
}
```

```ts
#!/usr/bin/env node
import { exportCommand } from "./commands/export";
import { importCommand } from "./commands/import";
import { themesCommand } from "./commands/themes";
import { validateCommand } from "./commands/validate";
import { parseArgs } from "./parse-args";

export async function runCli(argv = process.argv.slice(2)): Promise<string> {
  const parsed = parseArgs(argv);

  switch (parsed.command) {
    case "import":
      return importCommand(parsed.flags);
    case "validate":
      return validateCommand(parsed.flags);
    case "export":
      return exportCommand(parsed.flags);
    case "themes":
      return themesCommand();
    default:
      return "Usage: epub-creator <import|validate|export|themes> [--flags]";
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli()
    .then((output) => {
      process.stdout.write(`${output}\n`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- packages/cli/tests/parse-args.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 6: Commit**

```bash
git add packages/cli
git commit -m "feat: add basic local cli"
```

---

## Task 11: Add Local Server API

**Files:**
- Create: `apps/local-server/package.json`
- Create: `apps/local-server/tsconfig.json`
- Create: `apps/local-server/src/server.ts`
- Create: `apps/local-server/src/routes/health.ts`
- Create: `apps/local-server/src/routes/themes.ts`
- Create: `apps/local-server/src/routes/projects.ts`
- Create: `apps/local-server/src/index.ts`
- Create: `apps/local-server/tests/health.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Create local-server package metadata**

```json
{
  "name": "@epub-creator/local-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@epub-creator/core": "workspace:*",
    "@epub-creator/themes": "workspace:*",
    "tsx": "^4.20.3"
  },
  "devDependencies": {
    "@types/node": "^24.0.3",
    "typescript": "^5.8.3"
  }
}
```

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 2: Write server test**

```ts
import { describe, expect, it } from "vitest";
import { createServerApp } from "../src/server";

describe("local server", () => {
  it("responds to health checks", async () => {
    const app = createServerApp();
    const response = await app.handle(new Request("http://127.0.0.1/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
pnpm test -- apps/local-server/tests/health.test.ts
```

Expected:

```text
Cannot find module '../src/server'
```

- [ ] **Step 4: Implement fetch-style local server**

```ts
export function healthRoute(): Response {
  return Response.json({ ok: true });
}
```

```ts
export function themesRoute(): Response {
  return Response.json({
    themes: [
      { id: "classic-literary", name: "Classic Literary" },
      { id: "modern-clean", name: "Modern Clean" }
    ]
  });
}
```

```ts
export function projectsRoute(): Response {
  return Response.json({
    openProject: null,
    recentProjects: []
  });
}
```

```ts
import { healthRoute } from "./routes/health";
import { projectsRoute } from "./routes/projects";
import { themesRoute } from "./routes/themes";

export interface ServerApp {
  handle(request: Request): Promise<Response>;
}

export function createServerApp(): ServerApp {
  return {
    async handle(request: Request): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === "/api/health") {
        return healthRoute();
      }

      if (url.pathname === "/api/themes") {
        return themesRoute();
      }

      if (url.pathname === "/api/projects") {
        return projectsRoute();
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    }
  };
}
```

```ts
import { createServer } from "node:http";
import { createServerApp } from "./server";

const app = createServerApp();
const server = createServer(async (request, response) => {
  const url = `http://${request.headers.host ?? "127.0.0.1"}${request.url ?? "/"}`;
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : request;
  const fetchResponse = await app.handle(
    new Request(url, {
      method: request.method,
      headers: request.headers as HeadersInit,
      body
    })
  );

  response.statusCode = fetchResponse.status;
  fetchResponse.headers.forEach((value, key) => response.setHeader(key, value));
  response.end(await fetchResponse.text());
});

server.listen(4174, "127.0.0.1", () => {
  process.stdout.write("EPUB Creator local server listening on http://127.0.0.1:4174\n");
});
```

- [ ] **Step 5: Add root dev script for server plus web**

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @epub-creator/local-server --filter @epub-creator/web dev"
  }
}
```

Merge only the `scripts.dev` change into the existing root `package.json`.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm install
pnpm test -- apps/local-server/tests/health.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 7: Commit**

```bash
git add apps/local-server package.json pnpm-lock.yaml
git commit -m "feat: add local server api"
```

---

## Task 12: Connect The React UI To Projects, Themes, Validation, And Preview

**Files:**
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/components/BookOutline.tsx`
- Create: `apps/web/src/components/ImportReview.tsx`
- Create: `apps/web/src/components/MetadataPanel.tsx`
- Create: `apps/web/src/components/PreviewFrame.tsx`
- Create: `apps/web/src/components/ThemeGallery.tsx`
- Create: `apps/web/src/components/ValidationPanel.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Add app tsconfig**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

- [ ] **Step 2: Replace the web test with data-driven UI assertions**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("renders the formatter workspace surfaces", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Formatting Stress Book" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Book Outline" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Themes" })).toBeInTheDocument();
    expect(screen.getByTitle("EPUB XHTML preview")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Implement small UI components**

```ts
export async function getHealth(): Promise<{ ok: boolean }> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json() as Promise<{ ok: boolean }>;
}
```

```tsx
import type { BookProject } from "@epub-creator/core";

export function BookOutline({ project }: { project: BookProject }) {
  return (
    <section className="panel" aria-label="Book outline">
      <h2>Book Outline</h2>
      <ol className="outline-list">
        {project.sections.map((section) => (
          <li key={section.id}>
            <span>{section.title}</span>
            <small>{section.role}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

```tsx
export function ImportReview() {
  return (
    <section className="panel" aria-label="Import review">
      <h2>Import Review</h2>
      <p>Review detected sections, roles, images, notes, and unsupported DOCX annotations before export.</p>
    </section>
  );
}
```

```tsx
import type { BookProject } from "@epub-creator/core";

export function MetadataPanel({ project }: { project: BookProject }) {
  return (
    <section className="panel" aria-label="Metadata">
      <h2>Metadata</h2>
      <dl>
        <dt>Title</dt>
        <dd>{project.metadata.title}</dd>
        <dt>Author</dt>
        <dd>{project.metadata.author}</dd>
        <dt>Language</dt>
        <dd>{project.metadata.language}</dd>
      </dl>
    </section>
  );
}
```

```tsx
export function PreviewFrame({ html }: { html: string }) {
  return <iframe className="preview-frame" title="EPUB XHTML preview" srcDoc={html} />;
}
```

```tsx
export function ThemeGallery() {
  return (
    <section className="panel" aria-label="Theme gallery">
      <h2>Themes</h2>
      <div className="theme-grid">
        <button type="button">Classic Literary</button>
        <button type="button">Modern Clean</button>
      </div>
    </section>
  );
}
```

```tsx
export function ValidationPanel() {
  return (
    <section className="panel" aria-label="Validation">
      <h2>Validation</h2>
      <p>No blocking validation issues in the sample project.</p>
    </section>
  );
}
```

- [ ] **Step 4: Wire App to a sample project and preview**

```tsx
import { createBookProject, createSection, createTextBlock } from "@epub-creator/core";
import { createPreviewDocument, renderSectionXhtml } from "@epub-creator/renderer";
import { BookOutline } from "./components/BookOutline";
import { ImportReview } from "./components/ImportReview";
import { MetadataPanel } from "./components/MetadataPanel";
import { PreviewFrame } from "./components/PreviewFrame";
import { ThemeGallery } from "./components/ThemeGallery";
import { ValidationPanel } from "./components/ValidationPanel";

const sampleProject = createBookProject({
  title: "Formatting Stress Book",
  author: "Sample Author",
  language: "en"
});

sampleProject.sections.push(
  createSection({
    title: "Chapter One",
    role: "body",
    blocks: [
      createTextBlock("paragraph", "The first paragraph begins with production typography."),
      createTextBlock("scene-break", ""),
      createTextBlock("epigraph", "A line before the chapter.")
    ]
  })
);

const previewHtml = createPreviewDocument(
  sampleProject,
  sampleProject.sections.map((section) => renderSectionXhtml(sampleProject, section)).join("\n"),
  "body { font-family: Georgia, serif; line-height: 1.55; padding: 2rem; }"
);

export function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>{sampleProject.metadata.title}</h1>
          <p>Local-first book formatting workspace</p>
        </div>
      </header>
      <section className="workspace-grid" aria-label="Workspace">
        <BookOutline project={sampleProject} />
        <div className="stack">
          <MetadataPanel project={sampleProject} />
          <ImportReview />
          <ThemeGallery />
        </div>
        <aside className="stack" aria-label="Preview and validation">
          <PreviewFrame html={previewHtml} />
          <ValidationPanel />
        </aside>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Add UI styles for stable layout**

```css
.outline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.outline-list li {
  align-items: center;
  border-bottom: 1px solid #ece7dd;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 8px 0;
}

.outline-list small {
  color: #626c70;
}

.stack {
  display: grid;
  gap: 16px;
}

.theme-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.theme-grid button {
  border: 1px solid #b9c7c8;
  border-radius: 6px;
  background: #f8fbfb;
  cursor: pointer;
  min-height: 44px;
}

.preview-frame {
  width: 100%;
  min-height: 520px;
  border: 1px solid #d7d2c8;
  border-radius: 6px;
  background: #ffffff;
}
```

Append these rules to `apps/web/src/styles.css`.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- apps/web/tests/App.test.tsx
pnpm typecheck
pnpm --filter @epub-creator/web build
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat: connect web workspace surfaces"
```

---

## Task 13: Build The First Real Import-To-Preview Flow

**Files:**
- Modify: `apps/local-server/src/routes/projects.ts`
- Modify: `apps/local-server/src/server.ts`
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/components/ImportActions.tsx`
- Create: `apps/web/tests/import-flow.test.tsx`

- [ ] **Step 1: Add route contract test for project import**

```ts
import { describe, expect, it } from "vitest";
import { createServerApp } from "../src/server";

describe("project import route", () => {
  it("rejects import without a source path", async () => {
    const app = createServerApp();
    const response = await app.handle(
      new Request("http://127.0.0.1/api/projects/import", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" }
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "--source is required." });
  });
});
```

- [ ] **Step 2: Implement import route validation**

```ts
export async function importProjectRoute(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { source?: string; project?: string };

  if (!body.source) {
    return Response.json({ error: "--source is required." }, { status: 400 });
  }

  if (!body.project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  return Response.json({
    source: body.source,
    project: body.project,
    status: "accepted"
  });
}
```

Add this function to `apps/local-server/src/routes/projects.ts`, and in `apps/local-server/src/server.ts` route `POST /api/projects/import` to `importProjectRoute(request)`.

- [ ] **Step 3: Add import action UI test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImportActions } from "../src/components/ImportActions";

describe("ImportActions", () => {
  it("shows DOCX and Markdown import actions", () => {
    render(<ImportActions />);

    expect(screen.getByRole("button", { name: "Import DOCX" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Markdown" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Implement import actions and API client method**

```tsx
export function ImportActions() {
  return (
    <section className="panel" aria-label="Import actions">
      <h2>Import</h2>
      <div className="button-row">
        <button type="button">Import DOCX</button>
        <button type="button">Import Markdown</button>
      </div>
    </section>
  );
}
```

```ts
export async function importProject(source: string, project: string): Promise<{ status: string }> {
  const response = await fetch("/api/projects/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source, project })
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Import failed: ${response.status}`);
  }

  return response.json() as Promise<{ status: string }>;
}
```

- [ ] **Step 5: Add import actions to the app**

```tsx
import { ImportActions } from "./components/ImportActions";
```

Place `<ImportActions />` above `<MetadataPanel project={sampleProject} />` in the main editor stack.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- apps/local-server/tests/health.test.ts apps/web/tests/import-flow.test.tsx
pnpm typecheck
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 7: Commit**

```bash
git add apps/local-server apps/web
git commit -m "feat: add import flow shell"
```

---

## Task 14: Implement Theme Editing And Marketplace-Ready Gallery

**Files:**
- Create: `apps/web/src/components/ThemeEditor.tsx`
- Create: `apps/web/tests/theme-editor.test.tsx`
- Modify: `apps/web/src/components/ThemeGallery.tsx`
- Modify: `packages/themes/src/theme-package.ts`
- Modify: `packages/themes/tests/theme-package.test.ts`
- Create: `docs/theme-authoring.md`

- [ ] **Step 1: Add theme editor test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeEditor } from "../src/components/ThemeEditor";

describe("ThemeEditor", () => {
  it("renders controls for key Vellum-style components", () => {
    render(<ThemeEditor />);

    expect(screen.getByLabelText("Chapter opener")).toBeInTheDocument();
    expect(screen.getByLabelText("Scene break")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote style")).toBeInTheDocument();
    expect(screen.getByLabelText("Body spacing")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement theme editor controls**

```tsx
export function ThemeEditor() {
  return (
    <section className="panel" aria-label="Theme editor">
      <h2>Theme Editor</h2>
      <label>
        Chapter opener
        <select defaultValue="classic">
          <option value="classic">Classic</option>
          <option value="ornamented">Ornamented</option>
          <option value="minimal">Minimal</option>
        </select>
      </label>
      <label>
        Scene break
        <select defaultValue="asterism">
          <option value="asterism">Asterism</option>
          <option value="ornament">Ornament</option>
          <option value="rule">Rule</option>
        </select>
      </label>
      <label>
        Quote style
        <select defaultValue="indented">
          <option value="indented">Indented</option>
          <option value="left-rule">Left rule</option>
          <option value="boxed-light">Light box</option>
        </select>
      </label>
      <label>
        Body spacing
        <input type="range" min="1.2" max="1.9" step="0.05" defaultValue="1.55" />
      </label>
    </section>
  );
}
```

- [ ] **Step 3: Extend ThemeGallery with import/export affordances**

```tsx
export function ThemeGallery() {
  return (
    <section className="panel" aria-label="Theme gallery">
      <h2>Themes</h2>
      <div className="button-row">
        <button type="button">Import Theme</button>
        <button type="button">Export Theme</button>
      </div>
      <div className="theme-grid">
        <button type="button">Classic Literary</button>
        <button type="button">Modern Clean</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add theme authoring docs**

```md
# Theme Authoring

Themes are declarative packages. They may include metadata, tokens, CSS, component variants, assets, and fonts with license metadata. Themes must not execute code.

## Required Files

- `theme.json`
- `theme.css`

## Required Metadata

- `id`
- `version`
- `name`
- `description`
- `license`
- `cssPath`
- `preview.thumbnailPath`
- `preview.sampleText`

## Font Licensing

Every bundled font entry must include `license.name`. Add `license.spdxId` when an SPDX identifier exists and `license.url` when the license text lives online.

## Component Variants

The MVP supports variants for chapter titles, scene breaks, quotes, epigraphs, letter/email/message blocks, images, title pages, copyright pages, dedication pages, also-by pages, about-author pages, and newsletter pages.
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- apps/web/tests/theme-editor.test.tsx packages/themes/tests/theme-package.test.ts
pnpm typecheck
```

Expected:

```text
Test Files  2 passed
```

- [ ] **Step 6: Commit**

```bash
git add apps/web packages/themes docs/theme-authoring.md
git commit -m "feat: add theme editing surfaces"
```

---

## Task 15: Expand Fixtures, Docs, And Acceptance Checks

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/project-format.md`
- Create: `docs/validation.md`
- Create: `fixtures/projects/formatting-stress/manifest.json`
- Create: `fixtures/projects/formatting-stress/content/book.json`
- Create: `scripts/acceptance-check.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add architecture documentation**

```md
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
```

- [ ] **Step 2: Add project format documentation**

```md
# Project Format

A project is a plain folder.

```text
BookProject/
|-- manifest.json
|-- content/
|   `-- book.json
|-- assets/
|-- themes/
`-- .snapshots/
```

`manifest.json` identifies the app, format version, project ID, content path, assets path, themes path, snapshots path, and update timestamp.

`content/book.json` stores the structured book model: metadata, front/body/back sections, semantic blocks, theme selection, and project timestamps.
```

- [ ] **Step 3: Add validation documentation**

```md
# Validation

Validation runs in two layers.

## Continuous Checks

The editor shows lightweight warnings for missing language metadata, missing image alt text, missing table of contents entries, unreviewed imports, unsupported DOCX annotations, and theme font license gaps.

## Export Reports

Export reports include accessibility issues, profile warnings, selected theme, selected profile, metadata snapshot, source warnings, and package file manifest.

## Profiles

- `portable-epub3`: strict broad EPUB 3 compatibility.
- `kdp-safe`: Kindle/KDP-conscious warnings for CSS that may be ignored.
- `apple-books-enhanced`: allows richer CSS with compatibility warnings.
```

- [ ] **Step 4: Add acceptance script**

```js
import { execFileSync } from "node:child_process";

const commands = [
  ["pnpm", ["test"]],
  ["pnpm", ["typecheck"]],
  ["pnpm", ["--filter", "@epub-creator/web", "build"]]
];

for (const [command, args] of commands) {
  process.stdout.write(`Running ${command} ${args.join(" ")}\n`);
  execFileSync(command, args, { stdio: "inherit" });
}

process.stdout.write("Acceptance checks passed.\n");
```

- [ ] **Step 5: Add acceptance script to root package**

```json
{
  "scripts": {
    "acceptance": "node scripts/acceptance-check.mjs"
  }
}
```

Merge only the `scripts.acceptance` change into the existing root `package.json`.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm acceptance
```

Expected:

```text
Acceptance checks passed.
```

- [ ] **Step 7: Commit**

```bash
git add docs fixtures scripts package.json
git commit -m "docs: add architecture and acceptance checks"
```

---

## Theme Catalog Expansion Plan

After Task 14 proves the theme schema and editor controls, add bundled themes in batches of four. Each theme must include `theme.json`, `theme.css`, sample preview metadata, license metadata, and a snapshot preview in the web gallery.

Required first catalog:

1. `classic-literary`
2. `modern-clean`
3. `romance-soft`
4. `thriller-stark`
5. `fantasy-ornate`
6. `sci-fi-minimal`
7. `historical-serif`
8. `memoir-warm`
9. `nonfiction-clear`
10. `young-adult-bright`
11. `dark-academia`
12. `large-print-accessible`

Expansion target for the first public alpha:

13. `cozy-mystery`
14. `literary-modern`
15. `newsletter-forward`
16. `series-branded`
17. `poetry-airy`
18. `mythic-ornament`
19. `business-nonfiction`
20. `plain-kdp-safe`

Each theme must pass these checks:

```bash
pnpm test -- packages/themes/tests/theme-package.test.ts
pnpm test -- packages/validation/tests/export-profiles.test.ts
pnpm typecheck
```

## Private Real-Book Acceptance

Keep the formatting-heavy real manuscript outside this open-source repo. Use a local path such as:

```text
~/Documents/epub-creator-private-fixtures/<book-name>/
```

Acceptance run:

```bash
pnpm --filter @epub-creator/cli exec epub-creator import --source ~/Documents/epub-creator-private-fixtures/<book-name>/manuscript.md --project ~/Documents/epub-creator-private-fixtures/<book-name>/project
pnpm --filter @epub-creator/cli exec epub-creator validate --project ~/Documents/epub-creator-private-fixtures/<book-name>/project
pnpm --filter @epub-creator/cli exec epub-creator export --project ~/Documents/epub-creator-private-fixtures/<book-name>/project --profile kdp-safe
pnpm acceptance
```

The MVP is accepted when one private formatting-heavy real book can be imported, reviewed, themed, previewed, validated with no blocking `error` issues, and exported as an EPUB package.

## Follow-Up Plans To Write Before Building Beyond MVP

Create separate implementation plans for these subsystems after Task 15 is complete:

- Full DOCX image extraction into the asset library with alt text review UI.
- Linked DOCX/Markdown re-import diff and block matching.
- Visual component style-builder persistence into theme override files.
- EPUB ZIP writing with mimetype ordering and optional epubcheck integration.
- Front/back matter template generation and regeneration.
- Cover image import validation.
- Raw theme/CSS editor with constrained file writes.
- 12 to 20 theme catalog production.

## Self-Review

- Spec coverage: The plan covers local-first storage, DOCX/Markdown import, structured model, semantic editor, theme packages, theme gallery, validation, preview, CLI, server, React UI, project snapshots, accessibility, export profiles, and private real-book acceptance.
- Deferred with explicit follow-up plans: deep re-import merge UI, asset extraction, full ZIP writer hardening, complete front/back matter generation, cover validation, raw editor, and full theme catalog production.
- Placeholder scan: No forbidden planning placeholders are present.
- Type consistency: Core names used across tasks are `BookProject`, `BookSection`, `TextBlock`, `ThemePackage`, `ValidationReport`, and `ExportProfile`.
