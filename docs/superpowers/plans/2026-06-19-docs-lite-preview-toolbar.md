# Docs-Lite Preview Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact Google Docs-like toolbar above the editable preview for focused block edits.

**Architecture:** Keep `App` as the single state owner. Extend `EditablePreview` with local active-block tracking and toolbar controls that call `onSectionChange`.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, existing `@epub-creator/core` book types.

---

## File Structure

- Modify: `apps/web/src/components/EditablePreview.tsx` for toolbar, active block state, block kind changes, heading level changes, and scene-break insertion.
- Modify: `apps/web/src/styles.css` for the toolbar and active editable block styling.
- Modify: `apps/web/tests/App.test.tsx` for toolbar behavior tests.

### Task 1: Toolbar Behavior Test

**Files:**

- Modify: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test in the `describe("App", () => { ... })` block:

```tsx
it("uses the preview toolbar to edit the focused block", () => {
  render(<App />);

  const preview = screen.getByLabelText("Editable EPUB preview");
  const previewParagraph = within(preview).getByLabelText(
    "Preview block 1 (paragraph)",
  );

  expect(
    screen.getByRole("toolbar", { name: "Preview editing tools" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Block kind")).toBeDisabled();
  expect(screen.getByLabelText("Heading level")).toBeDisabled();

  fireEvent.focus(previewParagraph);
  expect(screen.getByLabelText("Block kind")).toHaveValue("paragraph");

  fireEvent.change(screen.getByLabelText("Block kind"), {
    target: { value: "heading" },
  });
  expect(screen.getByLabelText("Block 1 (heading)")).toHaveValue(
    "The first paragraph tests ordinary prose flow and margins in the preview pane.",
  );
  expect(
    within(preview).getByLabelText("Preview block 1 (heading)").tagName,
  ).toBe("H2");
  expect(screen.getByLabelText("Heading level")).toHaveValue("2");

  fireEvent.change(screen.getByLabelText("Heading level"), {
    target: { value: "3" },
  });
  expect(
    within(preview).getByLabelText("Preview block 1 (heading)").tagName,
  ).toBe("H3");

  fireEvent.click(screen.getByRole("button", { name: "Insert scene break" }));
  expect(
    within(preview).getByLabelText("Preview block 2 (scene-break)"),
  ).not.toHaveAttribute("contenteditable", "true");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because `Preview editing tools` does not exist.

### Task 2: Toolbar Implementation

**Files:**

- Modify: `apps/web/src/components/EditablePreview.tsx`

- [ ] **Step 1: Add active block state and toolbar helpers**

Update the imports in `apps/web/src/components/EditablePreview.tsx`:

```tsx
import {
  createElement,
  type ChangeEvent,
  type FocusEvent,
  useState,
} from "react";
import {
  createTextBlock,
  type BookProject,
  type BookSection,
  type HeadingLevel,
  type PlainTextBlockKind,
  type TextBlock,
  type TextBlockKind,
} from "@epub-creator/core/book";
```

Add:

```tsx
const TOOLBAR_BLOCK_KINDS: Array<
  Exclude<TextBlockKind, "image" | "scene-break">
> = [
  "paragraph",
  "heading",
  "chapter-title",
  "blockquote",
  "epigraph",
  "letter",
  "email",
  "message",
  "poem",
  "footnote",
  "endnote",
];

const HEADING_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];
```

Inside `EditablePreview`, add:

```tsx
const [activeBlockId, setActiveBlockId] = useState<string>();
const activeBlock = section.blocks.find((block) => block.id === activeBlockId);
const activeEditableBlock =
  activeBlock && isEditableBlock(activeBlock) ? activeBlock : undefined;
const activeHeadingLevel =
  activeEditableBlock?.kind === "heading"
    ? String(activeEditableBlock.level)
    : "";
```

Add helpers named `replaceBlock`, `changeActiveBlockKind`, `changeActiveHeadingLevel`, and `insertSceneBreak` that call `onSectionChange` with updated section copies.

- [ ] **Step 2: Render toolbar above preview content**

Add a `<div role="toolbar" aria-label="Preview editing tools">` before the preview article. Include:

```tsx
<select aria-label="Block kind" value={activeBlock?.kind ?? ""} disabled={!activeEditableBlock} />
<select aria-label="Heading level" value={activeHeadingLevel} disabled={activeBlock?.kind !== "heading"} />
<button type="button">Insert scene break</button>
```

- [ ] **Step 3: Track focused blocks**

Add `onFocus={() => setActiveBlockId(block.id)}` to editable preview blocks. Do not set active block id when the section title receives focus.

- [ ] **Step 4: Insert scene break**

Use `createTextBlock("scene-break", "")` and insert it after the active block, or append it when no active block exists.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

### Task 3: Toolbar Styling

**Files:**

- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Add compact toolbar styles**

Add:

```css
.preview-editor {
  display: grid;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border: 1px solid #d7d2c8;
  border-bottom: 0;
  border-radius: 4px 4px 0 0;
  background: #fbfaf7;
  padding: 8px;
}

.preview-toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-toolbar label {
  color: #626c70;
  font-size: 12px;
  text-transform: uppercase;
}

.preview-toolbar select,
.preview-toolbar button {
  min-height: 34px;
  border: 1px solid #cfc7bb;
  border-radius: 4px;
  background: #ffffff;
  color: #1f2528;
  font: inherit;
  padding: 6px 8px;
}

.editable-preview {
  border-radius: 0 0 4px 4px;
}

.editable-preview [data-active="true"] {
  outline-color: #7a4f17;
  background: #fffaf0;
}
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

### Task 4: Verification

**Files:**

- `apps/web/src/components/EditablePreview.tsx`
- `apps/web/src/styles.css`
- `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Run full tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Run build**

Run:

```bash
pnpm build
```

Expected: PASS.
