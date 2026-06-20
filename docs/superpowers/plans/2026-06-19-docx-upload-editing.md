# DOCX Upload Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user choose a Word `.docx` file in the web app, import it into the structured `BookProject` model, edit metadata/sections/blocks, preview the EPUB XHTML output, and save/export the edited project.

**Architecture:** Keep DOCX parsing in `@epub-creator/importers`, add buffer-based import alongside the existing path-based import, and expose upload/save/export through the local server. The React app should own the active `BookProject` state, update it immutably from editor controls, and reuse the existing renderer for live preview.

**Tech Stack:** Node.js 22 Fetch APIs (`Request.formData`, `File.arrayBuffer`), TypeScript, Vite React, Vitest, Mammoth.js `convertToHtml({ buffer })`, existing `@epub-creator/core`, `@epub-creator/importers`, `@epub-creator/renderer`, and `@epub-creator/epub` packages.

---

## Current State

- `packages/importers/src/docx.ts` already converts DOCX from a filesystem path with Mammoth and normalizes Mammoth HTML into `BookProject`.
- `apps/local-server/src/routes/projects.ts` only accepts JSON `{ source, project }`, so browser-selected files cannot be uploaded yet.
- `apps/web/src/App.tsx` renders a hard-coded `sampleProject`; imported projects do not become editable UI state.
- `apps/web/src/components/ImportActions.tsx` has path inputs and two buttons, but both buttons call the same JSON path import.
- `packages/core/src/book.ts` already has a structured model that is suitable for direct editing: metadata, sections, text blocks, block kind, and theme.

## Acceptance Criteria

- Selecting a `.docx` file in the browser imports the document without typing a local source path.
- The import response includes the full `BookProject`, the import report, section count, warning count, and the destination project path when provided.
- The outline switches from the sample project to the imported project.
- A user can edit title, author, language, section title, section role, and text for editable text blocks.
- The preview updates immediately after edits using `renderSectionFragment` and `createPreviewDocument`.
- Saving writes the edited `BookProject` back to the `.epubproj` folder.
- Exporting writes an `.epub` using the existing EPUB packaging code.
- Existing JSON path import behavior and tests continue to pass.
- Unsupported DOCX images are surfaced as import warnings in this first pass; binary DOCX image extraction is a separate follow-up unless explicitly pulled into scope.

## File Map

- Modify `packages/importers/src/docx.ts`: add a shared import helper and `importDocxBuffer(buffer, options)`.
- Modify `packages/importers/tests/html-to-book.test.ts`: verify path and buffer inputs sent to Mammoth.
- Modify `apps/local-server/src/routes/projects.ts`: add multipart upload handling, project save handling, and project export handling.
- Modify `apps/local-server/src/server.ts`: route new save/export endpoints.
- Modify `apps/local-server/package.json`: add `@epub-creator/epub` and `@epub-creator/validation` if export route uses them directly.
- Modify `apps/local-server/tests/project-import.test.ts`: cover multipart upload, validation errors, save, and export.
- Modify `apps/web/src/api/client.ts`: add typed upload/save/export client functions.
- Replace or expand `apps/web/src/components/ImportActions.tsx`: file upload UI and callbacks into app state.
- Modify `apps/web/src/App.tsx`: active project state, selected section state, import report state, preview derivation, and edit handlers.
- Modify `apps/web/src/components/BookOutline.tsx`: selectable outline items.
- Modify `apps/web/src/components/MetadataPanel.tsx`: editable metadata fields.
- Modify `apps/web/src/components/ImportReview.tsx`: render real import warnings/counts.
- Create `apps/web/src/components/SectionEditor.tsx`: edit section title/role and block text.
- Create `apps/web/src/components/ProjectActions.tsx`: save and export buttons.
- Modify `apps/web/src/styles.css`: dense editor controls, selected outline state, upload status, editor textarea layout.
- Modify `apps/web/tests/import-flow.test.tsx` and `apps/web/tests/App.test.tsx`: verify upload, edit, preview state, save/export calls.

## Task 1: Add Buffer-Based DOCX Import

**Files:**
- Modify: `packages/importers/src/docx.ts`
- Modify: `packages/importers/tests/html-to-book.test.ts`

- [ ] **Step 1: Write importer tests for Mammoth input shape**

Add tests proving the existing path API still calls Mammoth with `{ path }` and the new buffer API calls it with `{ buffer }`.

```ts
it("passes path input to mammoth for filesystem DOCX imports", async () => {
  convertToHtmlMock.mockResolvedValue({
    value: "<h1>Chapter One</h1><p>The first paragraph begins.</p>",
    messages: []
  });

  await importDocx("sample.docx", {
    sourcePath: "sample.docx",
    author: "Sample Author",
    language: "en"
  });

  expect(convertToHtmlMock).toHaveBeenCalledWith(
    { path: "sample.docx" },
    expect.objectContaining({
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: true
    })
  );
});

it("passes buffer input to mammoth for uploaded DOCX imports", async () => {
  convertToHtmlMock.mockResolvedValue({
    value: "<h1>Chapter One</h1><p>The first paragraph begins.</p>",
    messages: []
  });

  const buffer = Buffer.from("fake-docx");
  const result = await importDocxBuffer(buffer, {
    sourcePath: "upload.docx",
    author: "Sample Author",
    language: "en"
  });

  expect(convertToHtmlMock).toHaveBeenCalledWith(
    { buffer },
    expect.objectContaining({
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: true
    })
  );
  expect(result.project.sections).toHaveLength(1);
});
```

- [ ] **Step 2: Run the importer tests and confirm they fail**

Run: `pnpm test -- packages/importers/tests/html-to-book.test.ts`

Expected: FAIL because `importDocxBuffer` is not exported yet.

- [ ] **Step 3: Refactor `docx.ts` to share the Mammoth conversion path**

Use this shape, preserving the existing style map and warning behavior:

```ts
type MammothInput = { path: string } | { buffer: Buffer };

export async function importDocx(path: string, options: DocxImportOptions): Promise<HtmlImportResult> {
  return importDocxInput({ path }, options);
}

export async function importDocxBuffer(buffer: Buffer, options: DocxImportOptions): Promise<HtmlImportResult> {
  return importDocxInput({ buffer }, options);
}

async function importDocxInput(input: MammothInput, options: DocxImportOptions): Promise<HtmlImportResult> {
  const imageWarnings: ImportWarning[] = [];
  const result = await mammoth.convertToHtml(input, {
    styleMap: options.styleMap ?? [
      "p[style-name='Chapter Title'] => h2:fresh",
      "p[style-name='Scene Break'] => p.scene-break:fresh",
      "p[style-name='Epigraph'] => blockquote:fresh",
      "p[style-name='Letter'] => p.letter:fresh"
    ],
    includeDefaultStyleMap: true,
    ignoreEmptyParagraphs: true,
    convertImage: mammoth.images.imgElement(async (image) =>
      createUnsupportedDocxImageAttributes(image.contentType, imageWarnings)
    )
  });

  const imported = importHtmlFragment(result.value, options);
  imported.report.warnings.push(...imageWarnings);
  appendMammothMessages(imported.report, result.messages);
  return imported;
}
```

- [ ] **Step 4: Run the importer tests and commit**

Run: `pnpm test -- packages/importers/tests/html-to-book.test.ts`

Expected: PASS.

Commit:

```bash
git add packages/importers/src/docx.ts packages/importers/tests/html-to-book.test.ts
git commit -m "feat: support uploaded docx buffers"
```

## Task 2: Add Multipart Upload API

**Files:**
- Modify: `apps/local-server/src/routes/projects.ts`
- Modify: `apps/local-server/src/server.ts`
- Modify: `apps/local-server/tests/project-import.test.ts`

- [ ] **Step 1: Add route tests for upload success and validation**

Test a `POST /api/projects/import/upload` request with `FormData` containing:

- `file`: a `File` named `book.docx`
- `project`: a temp `.epubproj` path
- `author`: optional text
- `language`: optional text

Mocking Mammoth is already done in importer tests; for server tests, use the real importer only if a small DOCX fixture is added. Otherwise, add a narrow local-server test for request validation and keep conversion covered in the importer package.

Validation cases:

- missing file returns `400` with `DOCX file is required.`
- non-`.docx` filename returns `400` with `Only .docx uploads are supported.`
- file over the configured size limit returns `413` with `DOCX upload is too large.`

- [ ] **Step 2: Add the route**

In `createServerApp`, route:

```ts
if (pathname === "/api/projects/import/upload") {
  if (request.method !== "POST") {
    return methodNotAllowed("POST");
  }

  return importUploadedProjectRoute(request);
}
```

- [ ] **Step 3: Implement upload parsing**

Use Node 22 Fetch APIs:

```ts
const form = await request.formData();
const file = form.get("file");

if (!(file instanceof File)) {
  return Response.json({ error: "DOCX file is required." }, { status: 400 });
}

if (!file.name.toLowerCase().endsWith(".docx")) {
  return Response.json({ error: "Only .docx uploads are supported." }, { status: 400 });
}

if (file.size > 25 * 1024 * 1024) {
  return Response.json({ error: "DOCX upload is too large." }, { status: 413 });
}

const buffer = Buffer.from(await file.arrayBuffer());
const projectPath = readOptionalFormString(form, "project");
const imported = await importDocxBuffer(buffer, {
  sourcePath: file.name,
  author: readOptionalFormString(form, "author") ?? "Unknown Author",
  language: readOptionalFormString(form, "language") ?? "en"
});
```

If `projectPath` is present, write the project folder with `writeProjectFolder(projectPath, imported.project)`.

Return:

```ts
return Response.json({
  source: file.name,
  project: projectPath,
  status: "imported",
  title: imported.project.metadata.title,
  sectionCount: imported.project.sections.length,
  warningCount: imported.report.warnings.length,
  bookProject: imported.project,
  report: imported.report
});
```

- [ ] **Step 4: Run server tests and commit**

Run: `pnpm test -- apps/local-server/tests/project-import.test.ts`

Expected: PASS.

Commit:

```bash
git add apps/local-server/src/routes/projects.ts apps/local-server/src/server.ts apps/local-server/tests/project-import.test.ts
git commit -m "feat: add docx upload import api"
```

## Task 3: Add Web API Client Functions

**Files:**
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/tests/import-flow.test.tsx`

- [ ] **Step 1: Add typed response shapes**

```ts
import type { BookProject } from "@epub-creator/core/book";
import type { ImportReport } from "@epub-creator/importers";

export interface UploadedProjectResponse extends ImportProjectResponse {
  bookProject: BookProject;
  report: ImportReport;
}
```

- [ ] **Step 2: Add `uploadDocxProject`**

```ts
export async function uploadDocxProject(input: {
  file: File;
  project?: string;
  author?: string;
  language?: string;
}): Promise<UploadedProjectResponse> {
  const form = new FormData();
  form.set("file", input.file);
  setOptionalFormValue(form, "project", input.project);
  setOptionalFormValue(form, "author", input.author);
  setOptionalFormValue(form, "language", input.language);

  const response = await fetch("/api/projects/import/upload", {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Upload failed: ${response.status}`);
  }

  return response.json() as Promise<UploadedProjectResponse>;
}
```

- [ ] **Step 3: Test the request**

Assert `fetch` receives `body: expect.any(FormData)` and no manually set `content-type` header, so the browser supplies the multipart boundary.

- [ ] **Step 4: Run web import tests and commit**

Run: `pnpm test -- apps/web/tests/import-flow.test.tsx`

Expected: PASS.

Commit:

```bash
git add apps/web/src/api/client.ts apps/web/tests/import-flow.test.tsx
git commit -m "feat: add docx upload web client"
```

## Task 4: Replace Static Sample With Active Project State

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/ImportActions.tsx`
- Modify: `apps/web/src/components/BookOutline.tsx`
- Modify: `apps/web/src/components/ImportReview.tsx`
- Modify: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Introduce `activeProject` state**

In `App`, keep the current sample as an initial fallback, but render from state:

```ts
const [project, setProject] = useState<BookProject>(sampleProject);
const [projectPath, setProjectPath] = useState("");
const [selectedSectionId, setSelectedSectionId] = useState(project.sections[0]?.id ?? "");
const [importReport, setImportReport] = useState<ImportReport | undefined>();
```

- [ ] **Step 2: Wire upload completion**

Pass an `onImported` callback into `ImportActions`:

```tsx
<ImportActions
  onImported={(result) => {
    setProject(result.bookProject);
    setProjectPath(result.project ?? "");
    setSelectedSectionId(result.bookProject.sections[0]?.id ?? "");
    setImportReport(result.report);
  }}
/>
```

- [ ] **Step 3: Make `BookOutline` selectable**

Props:

```ts
interface BookOutlineProps {
  sections: BookSection[];
  selectedSectionId?: string;
  onSelectSection?: (sectionId: string) => void;
}
```

Render each item as a button with `aria-current={selected ? "true" : undefined}`.

- [ ] **Step 4: Render real import review data**

`ImportReview` should accept `report?: ImportReport`, `sectionCount: number`, and `warningCount: number`; render warning messages when present.

- [ ] **Step 5: Run app tests and commit**

Run: `pnpm test -- apps/web/tests/App.test.tsx apps/web/tests/import-flow.test.tsx`

Expected: PASS.

Commit:

```bash
git add apps/web/src/App.tsx apps/web/src/components/ImportActions.tsx apps/web/src/components/BookOutline.tsx apps/web/src/components/ImportReview.tsx apps/web/tests/App.test.tsx apps/web/tests/import-flow.test.tsx
git commit -m "feat: load uploaded docx into editor state"
```

## Task 5: Add Structured Metadata and Section Editing

**Files:**
- Modify: `apps/web/src/components/MetadataPanel.tsx`
- Create: `apps/web/src/components/SectionEditor.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Make metadata fields editable**

Change `MetadataPanel` props to:

```ts
interface MetadataPanelProps {
  metadata: Pick<BookMetadata, "title" | "author" | "language">;
  onChange: (metadata: Pick<BookMetadata, "title" | "author" | "language">) => void;
}
```

Use controlled inputs for title, author, and language.

- [ ] **Step 2: Add `SectionEditor`**

Props:

```ts
interface SectionEditorProps {
  section: BookSection;
  onChange: (section: BookSection) => void;
}
```

Controls:

- section title input
- section role select with `front`, `body`, `back`
- checkbox for `includeInToc`
- one textarea per text-like block
- read-only rows for `scene-break` and `image` blocks in this first pass

- [ ] **Step 3: Add immutable update helpers in `App`**

```ts
function updateProject(nextProject: BookProject): void {
  setProject({
    ...nextProject,
    updatedAt: new Date().toISOString()
  });
}

function updateSection(nextSection: BookSection): void {
  updateProject({
    ...project,
    sections: project.sections.map((section) =>
      section.id === nextSection.id ? nextSection : section
    )
  });
}
```

- [ ] **Step 4: Keep preview tied to selected section**

Derive:

```ts
const selectedSection =
  project.sections.find((section) => section.id === selectedSectionId) ??
  project.sections[0];
const renderedSections = selectedSection ? renderSectionFragment(project, selectedSection) : "";
```

- [ ] **Step 5: Test an edit updates visible preview text**

Use Testing Library to change a block textarea and assert the preview input state changes. Do not assert iframe internals unless the test environment can inspect `srcDoc` reliably.

- [ ] **Step 6: Run web tests and commit**

Run: `pnpm test -- apps/web/tests/App.test.tsx`

Expected: PASS.

Commit:

```bash
git add apps/web/src/App.tsx apps/web/src/components/MetadataPanel.tsx apps/web/src/components/SectionEditor.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: edit imported epub project content"
```

## Task 6: Add Save and Export Actions

**Files:**
- Modify: `apps/local-server/src/routes/projects.ts`
- Modify: `apps/local-server/src/server.ts`
- Modify: `apps/local-server/package.json`
- Modify: `apps/web/src/api/client.ts`
- Create: `apps/web/src/components/ProjectActions.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/local-server/tests/project-import.test.ts`
- Modify: `apps/web/tests/import-flow.test.tsx`

- [ ] **Step 1: Add save route**

`PUT /api/projects/save` accepts:

```ts
{
  "project": "/path/to/Book.epubproj",
  "bookProject": { "...": "BookProject" }
}
```

It validates `project` is a non-empty string and `bookProject` is an object, then calls `writeProjectFolder(project, bookProject as BookProject)`.

- [ ] **Step 2: Add export route**

`POST /api/projects/export` accepts:

```ts
{
  "project": "/path/to/Book.epubproj",
  "output": "/path/to/book.epub",
  "profile": "portable-epub3",
  "bookProject": { "...": "BookProject" }
}
```

It writes the latest project first, then calls:

```ts
const result = createEpubPackage(bookProject, "body { line-height: 1.55; }", profile);
await writeEpubFile({ projectDirectory: project, outputPath: output, packageResult: result });
```

- [ ] **Step 3: Add client functions**

```ts
export async function saveProject(project: string, bookProject: BookProject): Promise<{ status: string }> {
  return postJson("/api/projects/save", { project, bookProject }, "Save failed");
}

export async function exportProject(input: {
  project: string;
  output: string;
  profile: "portable-epub3" | "kdp-safe" | "apple-books-enhanced";
  bookProject: BookProject;
}): Promise<{ status: string; outputPath: string; issueCount: number }> {
  return postJson("/api/projects/export", input, "Export failed");
}
```

- [ ] **Step 4: Add `ProjectActions`**

Controls:

- Project folder input
- EPUB output path input
- Export profile select
- Save button
- Export EPUB button
- Status message

- [ ] **Step 5: Run server and web tests, then commit**

Run:

```bash
pnpm test -- apps/local-server/tests/project-import.test.ts apps/web/tests/import-flow.test.tsx
```

Expected: PASS.

Commit:

```bash
git add apps/local-server/src/routes/projects.ts apps/local-server/src/server.ts apps/local-server/package.json apps/web/src/api/client.ts apps/web/src/components/ProjectActions.tsx apps/web/src/App.tsx apps/local-server/tests/project-import.test.ts apps/web/tests/import-flow.test.tsx
git commit -m "feat: save and export edited epub projects"
```

## Task 7: Final Verification

**Files:**
- Modify only if failures require targeted fixes.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
pnpm test
pnpm typecheck
pnpm --filter @epub-creator/web build
pnpm acceptance
```

Expected: all commands pass.

- [ ] **Step 2: Manual browser smoke test**

Run:

```bash
pnpm dev
```

Open the Vite URL, select a DOCX file, import it, edit one paragraph, verify preview text updates, save the project, export an EPUB, and confirm the server reports success.

- [ ] **Step 3: Commit verification-only fixes if needed**

If verification requires small fixes:

```bash
git add <changed-files>
git commit -m "test: verify docx upload editing flow"
```

## Follow-Up: DOCX Image Extraction

Mammoth can provide DOCX image buffers through `convertImage`. The current importer intentionally warns and uses a placeholder because the project asset model is local-path oriented. Image support should be a separate small plan:

- add an importer asset output that can carry `Buffer` bytes
- persist uploaded image assets into `assets/images`
- create `image` blocks with real `assetId` values
- render captions in preview/export if present
- test duplicate filenames and media-type inference

## Self-Review

- Spec coverage: upload, import, edit, preview, save, and export are covered.
- Placeholder scan: no `TBD` or open-ended implementation placeholders remain.
- Type consistency: `BookProject`, `BookSection`, `ImportReport`, and existing export profile names match the current repo model.
