# Inline Preview Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users edit selected section title and editable text blocks directly in the preview pane.

**Architecture:** Replace the iframe-based app preview with a React-rendered editable preview component. Keep `App` as the only state owner and reuse the existing `handleSectionChange` path so sidebar editing, save, and export stay in sync.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, existing `@epub-creator/core` book types.

---

## File Structure

- Modify: `apps/web/tests/App.test.tsx` to assert inline preview editing.
- Create: `apps/web/src/components/EditablePreview.tsx` for direct preview rendering and blur commits.
- Modify: `apps/web/src/App.tsx` to use `EditablePreview`.
- Modify: `apps/web/src/styles.css` to style the editable preview surface.
- Delete: `apps/web/src/components/PreviewFrame.tsx` once no longer used.

### Task 1: Inline Editing Test

**Files:**

- Modify: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add `within` to the Testing Library import:

```ts
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
```

Replace iframe assertions with direct preview assertions and add a new test:

```ts
it("applies edits made directly in the preview pane", () => {
  render(<App />);

  const preview = screen.getByLabelText("Editable EPUB preview");
  const previewTitle = within(preview).getByLabelText("Preview section title");
  const previewParagraph = within(preview).getByLabelText(
    "Preview block 1 (paragraph)",
  );
  const sceneBreak = within(preview).getByLabelText(
    "Preview block 2 (scene-break)",
  );

  expect(previewTitle).toHaveAttribute("contenteditable", "true");
  expect(previewParagraph).toHaveAttribute("contenteditable", "true");
  expect(sceneBreak).not.toHaveAttribute("contenteditable", "true");

  previewTitle.textContent = "Edited In Preview";
  fireEvent.blur(previewTitle);
  previewParagraph.textContent = "Inline preview body edit.";
  fireEvent.blur(previewParagraph);

  expect(screen.getByRole("button", { name: "Edited In Preview" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  expect(screen.getByLabelText("Section title")).toHaveValue("Edited In Preview");
  expect(screen.getByLabelText("Block 1 (paragraph)")).toHaveValue(
    "Inline preview body edit.",
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because `Editable EPUB preview` does not exist yet.

### Task 2: Editable Preview Component

**Files:**

- Create: `apps/web/src/components/EditablePreview.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Delete: `apps/web/src/components/PreviewFrame.tsx`

- [ ] **Step 1: Write the implementation**

Create `apps/web/src/components/EditablePreview.tsx`:

```tsx
import { createElement, type FocusEvent } from "react";
import type {
  BookProject,
  BookSection,
  TextBlock,
} from "@epub-creator/core/book";

interface EditablePreviewProps {
  project: BookProject;
  section: BookSection;
  onSectionChange: (section: BookSection) => void;
}

const SECTION_EPUB_TYPES: Record<BookSection["role"], string> = {
  front: "frontmatter",
  body: "chapter",
  back: "backmatter",
};

export function EditablePreview({
  project,
  section,
  onSectionChange,
}: EditablePreviewProps) {
  function updateTitle(event: FocusEvent<HTMLElement>): void {
    const title = readEditableText(event.currentTarget);

    if (title !== section.title) {
      onSectionChange({ ...section, title });
    }
  }

  function updateBlock(block: TextBlock, text: string): void {
    if (!isEditableBlock(block) || text === block.text) {
      return;
    }

    onSectionChange({
      ...section,
      blocks: section.blocks.map((candidate) =>
        candidate.id === block.id ? { ...candidate, text } : candidate,
      ),
    });
  }

  return (
    <article className="editable-preview" aria-label="Editable EPUB preview">
      <section
        className="preview-section"
        data-epub-type={SECTION_EPUB_TYPES[section.role]}
        data-section-id={section.id}
      >
        <header className="chapter-title">
          <h1
            aria-label="Preview section title"
            contentEditable
            suppressContentEditableWarning
            onBlur={updateTitle}
          >
            {section.title}
          </h1>
        </header>
        {section.blocks.map((block, index) =>
          renderPreviewBlock(project, block, index, updateBlock),
        )}
      </section>
    </article>
  );
}

function renderPreviewBlock(
  project: BookProject,
  block: TextBlock,
  index: number,
  onBlur: (block: TextBlock, text: string) => void,
) {
  const label = `Preview block ${index + 1} (${block.kind})`;

  if (!isEditableBlock(block)) {
    return (
      <div
        key={block.id}
        aria-label={label}
        className={`preview-readonly-block ${classNameFor(block, block.kind)}`}
      >
        {summarizeReadOnlyBlock(project, block)}
      </div>
    );
  }

  return createElement(
    tagNameFor(block),
    {
      key: block.id,
      "aria-label": label,
      className: classNameFor(block, classNameBaseFor(block)),
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (event: FocusEvent<HTMLElement>) =>
        onBlur(block, readEditableText(event.currentTarget)),
    },
    block.text,
  );
}

function isEditableBlock(block: TextBlock): boolean {
  return block.kind !== "scene-break" && block.kind !== "image";
}

function tagNameFor(block: TextBlock): string {
  if (block.kind === "heading") {
    return `h${block.level}`;
  }

  if (block.kind === "chapter-title") {
    return "h1";
  }

  if (block.kind === "epigraph" || block.kind === "blockquote") {
    return "blockquote";
  }

  if (block.kind === "footnote" || block.kind === "endnote") {
    return "aside";
  }

  return block.kind === "paragraph" ? "p" : "div";
}

function classNameBaseFor(block: TextBlock): string {
  return block.kind === "heading" ? "heading" : block.kind;
}

function classNameFor(block: TextBlock, baseClassName: string): string {
  return [baseClassName, block.style?.cssClass].filter(Boolean).join(" ");
}

function summarizeReadOnlyBlock(
  project: BookProject,
  block: TextBlock,
): string {
  if (block.kind === "scene-break") {
    return "Scene break";
  }

  if (block.kind === "image") {
    const asset = project.assets.find(
      (candidate) => candidate.id === block.assetId,
    );
    return block.text || asset?.altText || "Image block";
  }

  return block.text;
}

function readEditableText(element: HTMLElement): string {
  return element.textContent ?? "";
}
```

- [ ] **Step 2: Wire it into App**

Replace:

```tsx
<PreviewFrame srcDoc={previewHtml} />
```

with:

```tsx
{
  previewSection ? (
    <EditablePreview
      project={activeProject}
      section={previewSection}
      onSectionChange={handleSectionChange}
    />
  ) : null;
}
```

Remove the preview HTML creation imports and variables from `App.tsx`.

- [ ] **Step 3: Add styles**

Replace the old `.preview-frame` styles with:

```css
.editable-preview {
  width: 100%;
  min-height: 0;
  height: 100%;
  overflow: auto;
  border: 1px solid #d7d2c8;
  border-radius: 4px;
  background: #ffffff;
  padding: 2rem;
  box-sizing: border-box;
  font-family: Georgia, serif;
  line-height: 1.55;
}

.editable-preview [contenteditable="true"] {
  outline: 1px solid transparent;
  border-radius: 3px;
  white-space: pre-wrap;
}

.editable-preview [contenteditable="true"]:focus {
  outline-color: #7a4f17;
  background: #fffaf0;
}

.preview-readonly-block {
  color: #626c70;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 13px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

### Task 3: Verification

**Files:**

- `apps/web/tests/App.test.tsx`
- `apps/web/src/components/EditablePreview.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run web typecheck**

Run:

```bash
pnpm --filter @epub-creator/web typecheck
```

Expected: PASS.
