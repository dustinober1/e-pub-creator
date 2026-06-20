# Google Docs Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the ten Google Docs familiarity features to EPUB Creator without turning the local-first EPUB formatter into a cloud word processor.

**Architecture:** Keep `App` as the owner of the active `BookProject`. Add small React components for outline, find/replace, version history, shortcuts, and preview modes; add only one core model field for review status; add local-server routes only for snapshot listing/restoring. Use existing renderer, import report, save/export, and snapshot primitives.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Node filesystem APIs, existing `@epub-creator/core`, `@epub-creator/renderer`, and `@epub-creator/validation` packages.

---

## Scope Cuts

- No Google auth, Google Drive sync, multiplayer cursors, or real-time collaboration.
- No full tracked-changes diff engine. "Suggest mode" is per-block review status.
- No new UI/editor dependency. Use existing React components, native drag/drop, and browser keyboard events.
- No cloud version history. Version history is backed by local `.snapshots`.

## Current Worktree Note

The current worktree already has uncommitted app changes around editable preview and toolbar work. Implementation must build on the existing files and must not revert unrelated changes.

## File Structure

- Modify: `apps/web/src/App.tsx` for project history, save state, autosave, preview mode, shortcut wiring, and new panels.
- Modify: `apps/web/src/components/BookOutline.tsx` for nested headings and section reordering.
- Modify: `apps/web/src/components/EditablePreview.tsx` for review-status toolbar actions and preview-mode compatibility.
- Modify: `apps/web/src/components/ImportReview.tsx` for cleanup checklist and import notes.
- Modify: `apps/web/src/components/ProjectActions.tsx` so manual save uses the shared save function from `App`.
- Create: `apps/web/src/components/FindReplacePanel.tsx` for manuscript search and replacements.
- Create: `apps/web/src/components/ShortcutsDialog.tsx` for the keyboard-shortcut reference.
- Create: `apps/web/src/components/VersionHistoryPanel.tsx` for local snapshot listing/restoring.
- Create: `apps/web/src/lib/find-replace.ts` for pure search/replace logic.
- Create: `apps/web/src/lib/project-history.ts` for pure undo/redo history logic.
- Modify: `apps/web/src/api/client.ts` for snapshot API client functions.
- Modify: `apps/local-server/src/server.ts` for snapshot routes.
- Modify: `apps/local-server/src/routes/projects.ts` for snapshot route handlers.
- Modify: `packages/core/src/book.ts` for optional block review status.
- Modify: `packages/core/src/snapshots.ts` for list/read snapshot helpers.
- Modify: `packages/core/src/index.ts` only if snapshot helpers are not already exported.
- Modify: `apps/web/src/styles.css` for outline headings, status, find/replace, shortcuts, review chips, version history, and preview-mode tabs.
- Test: `apps/web/tests/App.test.tsx`
- Test: `apps/web/tests/BookOutline.test.tsx`
- Test: `apps/web/tests/FindReplacePanel.test.tsx`
- Test: `apps/web/tests/find-replace.test.ts`
- Test: `apps/web/tests/project-history.test.ts`
- Test: `apps/web/tests/api-client.test.ts`
- Test: `apps/local-server/tests/project-import.test.ts`
- Test: `packages/core/tests/snapshots.test.ts`

## Feature To Task Map

- Docs-style outline: Task 2.
- Import cleanup checklist: Task 3.
- Familiar formatting toolbar: Tasks 7 and 9, building on current `EditablePreview`.
- Autosave status: Task 5.
- Version history snapshots: Task 6.
- Comment/import notes panel: Task 3.
- Suggest-mode-lite: Task 7.
- Find and replace: Task 4.
- Keyboard shortcuts: Task 9.
- Page/reading preview toggle: Task 8.

---

### Task 1: Centralize Project History For Undo/Redo

**Files:**

- Create: `apps/web/src/lib/project-history.ts`
- Create: `apps/web/tests/project-history.test.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing pure history tests**

Create `apps/web/tests/project-history.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../src/lib/project-history";

describe("project history", () => {
  it("tracks undo and redo states", () => {
    const first = createHistory("first");
    const second = pushHistory(first, "second");
    const third = pushHistory(second, "third");

    expect(third.present).toBe("third");
    expect(third.past).toEqual(["first", "second"]);
    expect(third.future).toEqual([]);

    const undone = undoHistory(third);
    expect(undone.present).toBe("second");
    expect(undone.past).toEqual(["first"]);
    expect(undone.future).toEqual(["third"]);

    const redone = redoHistory(undone);
    expect(redone.present).toBe("third");
    expect(redone.past).toEqual(["first", "second"]);
    expect(redone.future).toEqual([]);
  });

  it("ignores undo and redo when there is no matching history", () => {
    const history = createHistory("only");

    expect(undoHistory(history)).toEqual(history);
    expect(redoHistory(history)).toEqual(history);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/project-history.test.ts
```

Expected: FAIL because `apps/web/src/lib/project-history.ts` does not exist.

- [ ] **Step 3: Implement the minimal history helper**

Create `apps/web/src/lib/project-history.ts`:

```ts
export interface ProjectHistory<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(present: T): ProjectHistory<T> {
  return {
    past: [],
    present,
    future: [],
  };
}

export function pushHistory<T>(
  history: ProjectHistory<T>,
  present: T,
): ProjectHistory<T> {
  if (Object.is(history.present, present)) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present,
    future: [],
  };
}

export function undoHistory<T>(history: ProjectHistory<T>): ProjectHistory<T> {
  const previous = history.past.at(-1);

  if (previous === undefined) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: ProjectHistory<T>): ProjectHistory<T> {
  const next = history.future[0];

  if (next === undefined) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
```

- [ ] **Step 4: Wire `App` through history**

In `apps/web/src/App.tsx`, replace the direct `activeProject` state with history-backed state:

```tsx
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "./lib/project-history";
```

Use:

```tsx
const [projectHistory, setProjectHistory] = useState(() =>
  createHistory(sampleProject),
);
const activeProject = projectHistory.present;
```

Replace `setActiveProject(...)` calls with these helpers:

```tsx
function replaceProject(project: BookProject): void {
  setProjectHistory((current) => pushHistory(current, project));
}

function updateProject(recipe: (project: BookProject) => BookProject): void {
  setProjectHistory((current) =>
    pushHistory(current, {
      ...recipe(current.present),
      updatedAt: new Date().toISOString(),
    }),
  );
}

function undoProjectChange(): void {
  setProjectHistory(undoHistory);
}

function redoProjectChange(): void {
  setProjectHistory(redoHistory);
}
```

In `handleImported`, call `replaceProject(importedProject)` or `replaceProject(result.response.bookProject)` instead of setting active state directly.

- [ ] **Step 5: Run existing app tests**

Run:

```bash
pnpm test apps/web/tests/project-history.test.ts apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add apps/web/src/lib/project-history.ts apps/web/tests/project-history.test.ts apps/web/src/App.tsx apps/web/tests/App.test.tsx
git commit -m "feat: add project undo redo history"
```

---

### Task 2: Add Docs-Style Outline And Section Reordering

**Files:**

- Modify: `apps/web/src/components/BookOutline.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Create: `apps/web/tests/BookOutline.test.tsx`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the nested heading test**

Create `apps/web/tests/BookOutline.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSection, createTextBlock } from "@epub-creator/core/book";
import { BookOutline } from "../src/components/BookOutline";

describe("BookOutline", () => {
  it("shows section headings beneath their section", () => {
    const section = createSection({
      title: "Chapter One",
      role: "body",
      blocks: [
        createTextBlock("heading", "A familiar subheading", { level: 2 }),
        createTextBlock("paragraph", "Body copy."),
      ],
    });

    render(
      <BookOutline
        sections={[section]}
        selectedSectionId={section.id}
        onSelectSection={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Chapter One" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "A familiar subheading" }),
    ).toBeInTheDocument();
  });

  it("calls move callbacks from accessible reorder controls", () => {
    const first = createSection({
      title: "First",
      role: "body",
      blocks: [],
    });
    const second = createSection({
      title: "Second",
      role: "body",
      blocks: [],
    });
    const onMoveSection = vi.fn();

    render(
      <BookOutline
        sections={[first, second]}
        selectedSectionId={first.id}
        onMoveSection={onMoveSection}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Second up" }));
    expect(onMoveSection).toHaveBeenCalledWith(second.id, -1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/BookOutline.test.tsx
```

Expected: FAIL because heading buttons and move controls do not exist.

- [ ] **Step 3: Extend `BookOutline` props and render headings**

Update `apps/web/src/components/BookOutline.tsx`:

```tsx
import type { BookSection } from "@epub-creator/core/book";

interface BookOutlineProps {
  sections: BookSection[];
  selectedSectionId?: string;
  onMoveSection?: (sectionId: string, direction: -1 | 1) => void;
  onSelectSection?: (sectionId: string) => void;
}
```

For each section, render heading blocks under the section:

```tsx
const headingBlocks = section.blocks.filter(
  (block) => block.kind === "heading",
);
```

Each heading button should call `onSelectSection?.(section.id)`. This gives a Docs-like nested outline without adding block-level scroll targeting yet.

- [ ] **Step 4: Add reorder controls**

Inside each outline item, render:

```tsx
<div className="outline-actions" aria-label={`${section.title} section actions`}>
  <button
    type="button"
    disabled={index === 0}
    onClick={() => onMoveSection?.(section.id, -1)}
  >
    Move {section.title} up
  </button>
  <button
    type="button"
    disabled={index === sections.length - 1}
    onClick={() => onMoveSection?.(section.id, 1)}
  >
    Move {section.title} down
  </button>
</div>
```

Also add native drag/drop on the `<li>` using local `draggedSectionId` state. Drag/drop should call the same `onMoveSection` path by computing a target index. The buttons are the accessibility and test path.

- [ ] **Step 5: Wire section moves in `App`**

Add:

```tsx
function moveSection(sectionId: string, direction: -1 | 1): void {
  updateProject((project) => {
    const fromIndex = project.sections.findIndex(
      (section) => section.id === sectionId,
    );
    const toIndex = fromIndex + direction;

    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      toIndex >= project.sections.length
    ) {
      return project;
    }

    const sections = [...project.sections];
    const [section] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, section);

    return { ...project, sections };
  });
}
```

Pass `onMoveSection={moveSection}` to `BookOutline`.

- [ ] **Step 6: Add outline styles**

Add compact styles to `apps/web/src/styles.css`:

```css
.outline-heading-list {
  display: grid;
  gap: 4px;
  list-style: none;
  margin: 6px 0 0;
  padding: 0 0 0 12px;
}

.outline-heading-button {
  border: 0;
  background: transparent;
  color: #485256;
  cursor: pointer;
  padding: 2px 0;
  text-align: left;
}

.outline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.outline-actions button {
  border: 1px solid #e4ded3;
  border-radius: 4px;
  background: #ffffff;
  color: #485256;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 6px;
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/BookOutline.test.tsx apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add apps/web/src/components/BookOutline.tsx apps/web/src/App.tsx apps/web/src/styles.css apps/web/tests/BookOutline.test.tsx apps/web/tests/App.test.tsx
git commit -m "feat: add docs style book outline"
```

---

### Task 3: Upgrade Import Review Into Cleanup Checklist And Notes

**Files:**

- Modify: `apps/web/src/components/ImportReview.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing app test**

Add to `apps/web/tests/App.test.tsx`:

```tsx
it("shows a cleanup checklist and import notes after DOCX import", async () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Trigger DOCX Import" }));

  expect(
    await screen.findByRole("heading", { name: "Import Cleanup" }),
  ).toBeInTheDocument();
  expect(screen.getByText("2 sections detected")).toBeInTheDocument();
  expect(screen.getByText("1 import warning")).toBeInTheDocument();
  expect(screen.getByText("1 imported asset has alt text")).toBeInTheDocument();
  expect(
    screen.getByRole("list", { name: "Import notes" }),
  ).toBeInTheDocument();
  expect(screen.getByText("One image is missing alt text.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because `Import Cleanup` is not rendered.

- [ ] **Step 3: Pass the project into `ImportReview`**

In `apps/web/src/App.tsx`, change:

```tsx
<ImportReview
  report={importReport ?? undefined}
  projectPath={importedProjectPath}
  sectionCount={activeProject.sections.length}
/>
```

to:

```tsx
<ImportReview
  bookProject={activeProject}
  report={importReport ?? undefined}
  projectPath={importedProjectPath}
  sectionCount={activeProject.sections.length}
/>
```

- [ ] **Step 4: Add checklist rendering**

Update `apps/web/src/components/ImportReview.tsx` to accept `bookProject?: BookProject`.

Build these labels:

```tsx
const warningLabel = `${report.warnings.length} import ${
  report.warnings.length === 1 ? "warning" : "warnings"
}`;
const altTextCount = report.importedAssets.filter((asset) =>
  asset.altText.trim(),
).length;
const altTextLabel = `${altTextCount} imported ${
  altTextCount === 1 ? "asset has" : "assets have"
} alt text`;
const sceneBreakCount =
  bookProject?.sections.reduce(
    (total, section) =>
      total + section.blocks.filter((block) => block.kind === "scene-break").length,
    0,
  ) ?? 0;
```

Render a new heading and list:

```tsx
<h2 id="import-cleanup-heading">Import Cleanup</h2>
<ul className="cleanup-list" aria-label="Import cleanup checklist">
  <li>{`${sectionCount} ${sectionCount === 1 ? "section" : "sections"} detected`}</li>
  <li>{warningLabel}</li>
  <li>{altTextLabel}</li>
  <li>{`${sceneBreakCount} scene ${sceneBreakCount === 1 ? "break" : "breaks"} detected`}</li>
</ul>
```

Keep the existing warning messages, but label them as notes:

```tsx
<ul aria-label="Import notes">
  {report.warnings.map((warning) => (
    <li key={`${warning.code}-${warning.message}`}>
      <strong>{warning.code}</strong>: {warning.message}
    </li>
  ))}
</ul>
```

- [ ] **Step 5: Add compact checklist styles**

Add to `apps/web/src/styles.css`:

```css
.cleanup-list {
  display: grid;
  gap: 6px;
  margin: 0 0 12px;
  padding-left: 18px;
  color: #485256;
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add apps/web/src/components/ImportReview.tsx apps/web/src/App.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: add import cleanup checklist"
```

---

### Task 4: Add Find And Replace

**Files:**

- Create: `apps/web/src/lib/find-replace.ts`
- Create: `apps/web/tests/find-replace.test.ts`
- Create: `apps/web/src/components/FindReplacePanel.tsx`
- Create: `apps/web/tests/FindReplacePanel.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write pure search/replace tests**

Create `apps/web/tests/find-replace.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { findMatches, replaceAllMatches } from "../src/lib/find-replace";

const project = {
  ...createBookProject({
    title: "Find Book",
    author: "A. Writer",
    language: "en",
  }),
  sections: [
    createSection({
      title: "Opening Scene",
      role: "body",
      blocks: [
        createTextBlock("paragraph", "The door opened."),
        createTextBlock("scene-break", ""),
        createTextBlock("paragraph", "Another door closed."),
      ],
    }),
  ],
};

describe("find replace", () => {
  it("finds matches in section titles and editable text blocks", () => {
    expect(findMatches(project, "door")).toEqual([
      expect.objectContaining({
        blockId: project.sections[0]?.blocks[0]?.id,
        sectionId: project.sections[0]?.id,
        text: "The door opened.",
      }),
      expect.objectContaining({
        blockId: project.sections[0]?.blocks[2]?.id,
        sectionId: project.sections[0]?.id,
        text: "Another door closed.",
      }),
    ]);
  });

  it("replaces all editable text matches case-insensitively", () => {
    const updated = replaceAllMatches(project, "door", "gate");

    expect(updated.sections[0]?.blocks[0]?.text).toBe("The gate opened.");
    expect(updated.sections[0]?.blocks[2]?.text).toBe("Another gate closed.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/find-replace.test.ts
```

Expected: FAIL because `find-replace.ts` does not exist.

- [ ] **Step 3: Implement pure search/replace**

Create `apps/web/src/lib/find-replace.ts`:

```ts
import type { BookProject, TextBlock } from "@epub-creator/core/book";

export interface FindMatch {
  blockId?: string;
  sectionId: string;
  text: string;
}

export function findMatches(project: BookProject, query: string): FindMatch[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const needle = trimmed.toLocaleLowerCase();
  const matches: FindMatch[] = [];

  for (const section of project.sections) {
    if (section.title.toLocaleLowerCase().includes(needle)) {
      matches.push({ sectionId: section.id, text: section.title });
    }

    for (const block of section.blocks) {
      if (!isEditableTextBlock(block)) {
        continue;
      }

      if (block.text.toLocaleLowerCase().includes(needle)) {
        matches.push({
          blockId: block.id,
          sectionId: section.id,
          text: block.text,
        });
      }
    }
  }

  return matches;
}

export function replaceAllMatches(
  project: BookProject,
  query: string,
  replacement: string,
): BookProject {
  const trimmed = query.trim();

  if (!trimmed) {
    return project;
  }

  const pattern = new RegExp(escapeRegExp(trimmed), "gi");

  return {
    ...project,
    sections: project.sections.map((section) => ({
      ...section,
      title: section.title.replace(pattern, replacement),
      blocks: section.blocks.map((block) =>
        isEditableTextBlock(block)
          ? { ...block, text: block.text.replace(pattern, replacement) }
          : block,
      ),
    })),
  };
}

function isEditableTextBlock(block: TextBlock): boolean {
  return block.kind !== "image" && block.kind !== "scene-break";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

- [ ] **Step 4: Write `FindReplacePanel` test**

Create `apps/web/tests/FindReplacePanel.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createBookProject,
  createSection,
  createTextBlock,
} from "@epub-creator/core/book";
import { FindReplacePanel } from "../src/components/FindReplacePanel";

describe("FindReplacePanel", () => {
  it("replaces all matches through the panel", () => {
    const project = {
      ...createBookProject({
        title: "Panel Book",
        author: "A. Writer",
        language: "en",
      }),
      sections: [
        createSection({
          title: "Chapter",
          role: "body",
          blocks: [createTextBlock("paragraph", "old word")],
        }),
      ],
    };
    const onProjectChange = vi.fn();

    render(
      <FindReplacePanel
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Find"), {
      target: { value: "old" },
    });
    fireEvent.change(screen.getByLabelText("Replace"), {
      target: { value: "new" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Replace All" }));

    expect(onProjectChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [
          expect.objectContaining({
            blocks: [expect.objectContaining({ text: "new word" })],
          }),
        ],
      }),
    );
  });
});
```

- [ ] **Step 5: Implement `FindReplacePanel`**

Create `apps/web/src/components/FindReplacePanel.tsx`:

```tsx
import { useMemo, useState } from "react";
import type { BookProject } from "@epub-creator/core/book";
import { findMatches, replaceAllMatches } from "../lib/find-replace";

interface FindReplacePanelProps {
  project: BookProject;
  onProjectChange: (project: BookProject) => void;
}

export function FindReplacePanel({
  project,
  onProjectChange,
}: FindReplacePanelProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const matches = useMemo(() => findMatches(project, query), [project, query]);

  return (
    <section className="panel" aria-labelledby="find-replace-heading">
      <h2 id="find-replace-heading">Find and Replace</h2>
      <div className="metadata-list">
        <label className="editor-field">
          <span>Find</span>
          <input
            id="find-replace-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="editor-field">
          <span>Replace</span>
          <input
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
          />
        </label>
      </div>
      <div className="button-row">
        <button
          type="button"
          disabled={!query.trim()}
          onClick={() =>
            onProjectChange(replaceAllMatches(project, query, replacement))
          }
        >
          Replace All
        </button>
      </div>
      <p className="panel-copy">
        {matches.length} {matches.length === 1 ? "match" : "matches"}
      </p>
      {matches.length > 0 ? (
        <ol className="find-results" aria-label="Find results">
          {matches.slice(0, 8).map((match, index) => (
            <li key={`${match.sectionId}-${match.blockId ?? "title"}-${index}`}>
              {match.text}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 6: Add panel to `App`**

Render inside the right sidebar before `ImportReview`:

```tsx
<FindReplacePanel project={activeProject} onProjectChange={replaceProject} />
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/find-replace.test.ts apps/web/tests/FindReplacePanel.test.tsx apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add apps/web/src/lib/find-replace.ts apps/web/tests/find-replace.test.ts apps/web/src/components/FindReplacePanel.tsx apps/web/tests/FindReplacePanel.test.tsx apps/web/src/App.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: add manuscript find replace"
```

---

### Task 5: Add Save Status And Autosave

**Files:**

- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/ProjectActions.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the autosave test**

Add to `apps/web/tests/App.test.tsx`:

```tsx
it("autosaves imported projects after edits", async () => {
  vi.useFakeTimers();
  saveProjectMock.mockResolvedValue({
    status: "saved",
    project: "/tmp/Imported.epubproj",
  });

  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Trigger DOCX Import" }));
  expect(
    await screen.findByRole("heading", { name: "Imported Through App State" }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Autosaved Title" },
  });

  expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

  await vi.advanceTimersByTimeAsync(900);

  expect(saveProjectMock).toHaveBeenCalledWith(
    "/tmp/Imported.epubproj",
    expect.objectContaining({
      metadata: expect.objectContaining({ title: "Autosaved Title" }),
    }),
  );
  expect(await screen.findByText(/Saved/)).toBeInTheDocument();

  vi.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because autosave status does not exist.

- [ ] **Step 3: Move manual save control to `App`**

In `apps/web/src/App.tsx`, import `saveProject`:

```tsx
import { saveProject } from "./api/client";
```

Add state:

```tsx
type SaveState =
  | { kind: "idle"; label: string }
  | { kind: "dirty"; label: string }
  | { kind: "saving"; label: string }
  | { kind: "saved"; label: string }
  | { kind: "error"; label: string };

const [saveState, setSaveState] = useState<SaveState>({
  kind: "idle",
  label: "Not saved",
});
```

Inside every project-changing helper (`replaceProject`, `updateProject`) call:

```tsx
setSaveState({ kind: "dirty", label: "Unsaved changes" });
```

Add:

```tsx
async function saveCurrentProject(): Promise<void> {
  const trimmedProjectPath = projectFolderPath.trim();

  if (!trimmedProjectPath) {
    setSaveState({
      kind: "error",
      label: "Project folder is required.",
    });
    return;
  }

  setSaveState({ kind: "saving", label: "Saving..." });

  try {
    const result = await saveProject(trimmedProjectPath, activeProject);
    setSaveState({
      kind: "saved",
      label: `Saved ${new Date().toLocaleTimeString()}`,
    });
    setProjectFolderPath(result.project);
  } catch (error) {
    setSaveState({
      kind: "error",
      label: error instanceof Error ? error.message : String(error),
    });
  }
}
```

- [ ] **Step 4: Add debounced autosave**

Add an effect in `App`:

```tsx
useEffect(() => {
  if (saveState.kind !== "dirty" || !projectFolderPath.trim()) {
    return;
  }

  const timeout = window.setTimeout(() => {
    void saveCurrentProject();
  }, 800);

  return () => window.clearTimeout(timeout);
}, [activeProject, projectFolderPath, saveState.kind]);
```

Add a short comment above it:

```tsx
// ponytail: debounce only; add conflict detection if multi-window editing matters.
```

- [ ] **Step 5: Update `ProjectActions` props**

In `apps/web/src/components/ProjectActions.tsx`, remove direct `saveProject` import and accept:

```tsx
interface ProjectActionsProps {
  bookProject: BookProject;
  projectPath: string;
  onProjectPathChange: (projectPath: string) => void;
  onSaveProject: () => Promise<void>;
}
```

Replace `submitSave` with:

```tsx
async function submitSave(): Promise<void> {
  setStatus("");
  await onSaveProject();
}
```

Keep export behavior unchanged.

- [ ] **Step 6: Render status in the topbar**

In `App`, inside `.topbar`, render:

```tsx
<span className={`save-status save-status-${saveState.kind}`}>
  {saveState.label}
</span>
```

Pass `onSaveProject={saveCurrentProject}` to `ProjectActions`.

- [ ] **Step 7: Add status styles**

Add to `apps/web/src/styles.css`:

```css
.save-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid #d7d2c8;
  border-radius: 4px;
  color: #485256;
  font-size: 12px;
  margin-top: 8px;
  padding: 2px 8px;
}

.save-status-dirty {
  border-color: #c89134;
  color: #7a4f17;
}

.save-status-error {
  border-color: #b64b3a;
  color: #8f2f23;
}
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```bash
git add apps/web/src/App.tsx apps/web/src/components/ProjectActions.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: add autosave status"
```

---

### Task 6: Add Local Version History From Snapshots

**Files:**

- Modify: `packages/core/src/snapshots.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/tests/snapshots.test.ts`
- Modify: `apps/local-server/src/routes/projects.ts`
- Modify: `apps/local-server/src/server.ts`
- Modify: `apps/local-server/tests/project-import.test.ts`
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/tests/api-client.test.ts`
- Create: `apps/web/src/components/VersionHistoryPanel.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write core snapshot tests**

Add to `packages/core/tests/snapshots.test.ts`:

```ts
it("lists and reads created snapshots", async () => {
  const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));
  const project = createBookProject({
    title: "Snapshot Book",
    author: "A. Writer",
    language: "en",
  });

  const snapshot = await createSnapshot(directory, project, "before-export");
  const snapshots = await listSnapshots(directory);
  const restored = await readSnapshot(directory, snapshot.id);

  expect(snapshots).toEqual([
    expect.objectContaining({
      id: snapshot.id,
      reason: "before-export",
    }),
  ]);
  expect(restored.metadata.title).toBe("Snapshot Book");
});

it("rejects unsafe snapshot ids", async () => {
  const directory = await mkdtemp(join(tmpdir(), "epub-snapshot-"));

  await expect(readSnapshot(directory, "../book")).rejects.toThrow(
    "Invalid snapshot id",
  );
});
```

Update the test import:

```ts
import { createSnapshot, listSnapshots, readSnapshot } from "../src/snapshots";
```

- [ ] **Step 2: Run core test to verify it fails**

Run:

```bash
pnpm test packages/core/tests/snapshots.test.ts
```

Expected: FAIL because `listSnapshots` and `readSnapshot` do not exist.

- [ ] **Step 3: Implement snapshot list/read helpers**

In `packages/core/src/snapshots.ts`, add `"before-restore"` to `ProjectSnapshot["reason"]`, then update the existing imports to:

```ts
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BookProject } from "./book";
import { createId } from "./ids";
import { PROJECT_FOLDER_PATHS } from "./manifest";
import { assertBookProject } from "./project-folder";
```

Add:

```ts
const SNAPSHOT_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export async function listSnapshots(directory: string): Promise<ProjectSnapshot[]> {
  const snapshotDirectory = join(directory, PROJECT_FOLDER_PATHS.snapshots);
  const entries = await readdir(snapshotDirectory).catch(() => []);

  return entries
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => {
      const id = entry.replace(/\.json$/, "");
      return {
        id,
        reason: readReasonFromSnapshotId(id),
        path: join(snapshotDirectory, entry),
        createdAt: readCreatedAtFromSnapshotId(id),
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function readSnapshot(
  directory: string,
  snapshotId: string,
): Promise<BookProject> {
  if (!SNAPSHOT_ID_PATTERN.test(snapshotId)) {
    throw new Error("Invalid snapshot id.");
  }

  const raw = await readFile(
    join(directory, PROJECT_FOLDER_PATHS.snapshots, `${snapshotId}.json`),
    "utf8",
  );
  const project = JSON.parse(raw) as unknown;

  assertBookProject(project);

  return project;
}

function readCreatedAtFromSnapshotId(snapshotId: string): string {
  const stamp = snapshotId.split("-before-")[0] ?? snapshotId;
  return stamp.replace(
    /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z).*$/,
    "$1:$2:$3.$4",
  );
}

function readReasonFromSnapshotId(snapshotId: string): ProjectSnapshot["reason"] {
  const reason = snapshotId.match(/-(before-[a-z-]+)-snapshot-/)?.[1];

  if (
    reason === "before-import" ||
    reason === "before-reimport" ||
    reason === "before-theme-change" ||
    reason === "before-frontmatter-regeneration" ||
    reason === "before-export" ||
    reason === "before-restore"
  ) {
    return reason;
  }

  return "before-export";
}
```

- [ ] **Step 4: Add server route tests**

Add request helpers to `apps/local-server/tests/project-import.test.ts`:

```ts
function snapshotListRequest(project: string): Request {
  return new Request(
    `http://127.0.0.1/api/projects/snapshots?project=${encodeURIComponent(project)}`,
  );
}

function snapshotRestoreRequest(body: string): Request {
  return new Request("http://127.0.0.1/api/projects/snapshots/restore", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}
```

Add:

```ts
it("lists and restores project snapshots", async () => {
  const directory = await mkdtemp(join(tmpdir(), "epub-server-snapshots-"));

  try {
    const project = join(directory, "Draft.epubproj");
    const first = createBookProjectFixture("First Title");
    await writeProjectFolder(project, first);
    const snapshot = await createSnapshot(project, first, "before-export");

    const second = createBookProjectFixture("Second Title");
    await writeProjectFolder(project, second);

    const app = createServerApp();
    const listResponse = await app.handle(snapshotListRequest(project));
    const listBody = (await listResponse.json()) as { snapshots: unknown[] };

    expect(listResponse.status).toBe(200);
    expect(listBody.snapshots).toHaveLength(1);

    const restoreResponse = await app.handle(
      snapshotRestoreRequest(JSON.stringify({ project, snapshotId: snapshot.id })),
    );
    const restoreBody = (await restoreResponse.json()) as {
      bookProject: { metadata: { title: string } };
    };

    expect(restoreResponse.status).toBe(200);
    expect(restoreBody.bookProject.metadata.title).toBe("First Title");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
```

Add imports:

```ts
import {
  createSnapshot,
  readProjectFolder,
  writeProjectFolder,
} from "@epub-creator/core";
```

- [ ] **Step 5: Implement server routes**

In `apps/local-server/src/server.ts`, route:

```ts
if (pathname === "/api/projects/snapshots") {
  if (!isReadOnlyMethod(request.method)) {
    return methodNotAllowed();
  }

  return snapshotsRoute(request);
}

if (pathname === "/api/projects/snapshots/restore") {
  if (request.method !== "POST") {
    return methodNotAllowed("POST");
  }

  return restoreSnapshotRoute(request);
}
```

In `apps/local-server/src/routes/projects.ts`, import:

```ts
import {
  assertBookProject,
  copyProjectAssetSources,
  createSnapshot,
  listSnapshots,
  readProjectFolder,
  readSnapshot,
  type BookProject,
  writeProjectFolder,
} from "@epub-creator/core";
```

Add:

```ts
export async function snapshotsRoute(request: Request): Promise<Response> {
  const project = new URL(request.url).searchParams.get("project")?.trim();

  if (!project) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  try {
    return Response.json({ snapshots: await listSnapshots(project) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Snapshot list failed: ${message}` }, { status: 400 });
  }
}

export async function restoreSnapshotRoute(request: Request): Promise<Response> {
  const body = await readJsonObject(request);

  if (body instanceof Response) {
    return body;
  }

  if (typeof body.project !== "string" || !body.project.trim()) {
    return Response.json({ error: "--project is required." }, { status: 400 });
  }

  if (typeof body.snapshotId !== "string" || !body.snapshotId.trim()) {
    return Response.json({ error: "--snapshotId is required." }, { status: 400 });
  }

  const project = body.project.trim();

  try {
    const current = await readProjectFolder(project);
    await createSnapshot(project, current, "before-restore");
    const restored = await readSnapshot(project, body.snapshotId.trim());
    await writeProjectFolder(project, restored);
    await copyProjectAssetSources(project, restored);

    return Response.json({
      status: "restored",
      project,
      bookProject: restored,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Snapshot restore failed: ${message}` }, { status: 400 });
  }
}
```

- [ ] **Step 6: Add API client tests and functions**

In `apps/web/tests/api-client.test.ts`, add tests for:

```ts
listProjectSnapshots("/tmp/Draft.epubproj")
restoreProjectSnapshot("/tmp/Draft.epubproj", "snapshot-1")
```

Expected fetch calls:

```ts
fetch("/api/projects/snapshots?project=%2Ftmp%2FDraft.epubproj")
fetch("/api/projects/snapshots/restore", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    project: "/tmp/Draft.epubproj",
    snapshotId: "snapshot-1",
  }),
})
```

In `apps/web/src/api/client.ts`, add:

```ts
export interface ProjectSnapshotSummary {
  id: string;
  reason: string;
  path: string;
  createdAt: string;
}

export async function listProjectSnapshots(
  project: string,
): Promise<{ snapshots: ProjectSnapshotSummary[] }> {
  const response = await fetch(
    `/api/projects/snapshots?project=${encodeURIComponent(project)}`,
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Snapshot list failed: ${response.status}`);
  }

  return response.json() as Promise<{ snapshots: ProjectSnapshotSummary[] }>;
}

export async function restoreProjectSnapshot(
  project: string,
  snapshotId: string,
): Promise<{ status: string; project: string; bookProject: BookProject }> {
  const response = await fetch("/api/projects/snapshots/restore", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ project, snapshotId }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Snapshot restore failed: ${response.status}`);
  }

  return response.json() as Promise<{
    status: string;
    project: string;
    bookProject: BookProject;
  }>;
}
```

- [ ] **Step 7: Add `VersionHistoryPanel`**

Create `apps/web/src/components/VersionHistoryPanel.tsx`:

```tsx
import { useState } from "react";
import type { BookProject } from "@epub-creator/core/book";
import {
  listProjectSnapshots,
  restoreProjectSnapshot,
  type ProjectSnapshotSummary,
} from "../api/client";

interface VersionHistoryPanelProps {
  projectPath: string;
  onRestore: (project: BookProject) => void;
}

export function VersionHistoryPanel({
  projectPath,
  onRestore,
}: VersionHistoryPanelProps) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshotSummary[]>([]);
  const [status, setStatus] = useState("");

  async function refresh(): Promise<void> {
    const trimmedProjectPath = projectPath.trim();

    if (!trimmedProjectPath) {
      setStatus("Project folder is required.");
      return;
    }

    setStatus("Loading...");

    try {
      const result = await listProjectSnapshots(trimmedProjectPath);
      setSnapshots(result.snapshots);
      setStatus(`${result.snapshots.length} versions found.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function restore(snapshotId: string): Promise<void> {
    const result = await restoreProjectSnapshot(projectPath.trim(), snapshotId);
    onRestore(result.bookProject);
    setStatus("Version restored.");
  }

  return (
    <section className="panel" aria-labelledby="version-history-heading">
      <h2 id="version-history-heading">Version History</h2>
      <div className="button-row">
        <button type="button" onClick={() => void refresh()}>
          Refresh Versions
        </button>
      </div>
      {status ? <p className="import-status">{status}</p> : null}
      {snapshots.length > 0 ? (
        <ol className="version-list" aria-label="Version history">
          {snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <span>{`${snapshot.createdAt} / ${snapshot.reason}`}</span>
              <button type="button" onClick={() => void restore(snapshot.id)}>
                Restore
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
```

Render it in `App` near `ProjectActions`:

```tsx
<VersionHistoryPanel
  projectPath={projectFolderPath}
  onRestore={replaceProject}
/>
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm test packages/core/tests/snapshots.test.ts apps/local-server/tests/project-import.test.ts apps/web/tests/api-client.test.ts apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```bash
git add packages/core/src/snapshots.ts packages/core/src/index.ts packages/core/tests/snapshots.test.ts apps/local-server/src/routes/projects.ts apps/local-server/src/server.ts apps/local-server/tests/project-import.test.ts apps/web/src/api/client.ts apps/web/tests/api-client.test.ts apps/web/src/components/VersionHistoryPanel.tsx apps/web/src/App.tsx apps/web/src/styles.css
git commit -m "feat: add local version history"
```

---

### Task 7: Add Suggest-Mode-Lite Review Status

**Files:**

- Modify: `packages/core/src/book.ts`
- Modify: `apps/web/src/components/EditablePreview.tsx`
- Modify: `apps/web/src/components/SectionEditor.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing review-status test**

Add to `apps/web/tests/App.test.tsx`:

```tsx
it("marks focused blocks for review and accepts them", () => {
  render(<App />);

  const preview = screen.getByLabelText("Editable EPUB preview");
  const previewParagraph = within(preview).getByLabelText(
    "Preview block 1 (paragraph)",
  );

  fireEvent.focus(previewParagraph);
  fireEvent.click(screen.getByRole("button", { name: "Mark Needs Review" }));

  expect(screen.getByText("needs review")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Accept Block" }));

  expect(screen.getByText("accepted")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because review buttons do not exist.

- [ ] **Step 3: Add the optional core type**

In `packages/core/src/book.ts`, add:

```ts
export type ReviewStatus = "needs-review" | "accepted";
```

Then add to `TextBlockBase`:

```ts
reviewStatus?: ReviewStatus;
```

No project migration is needed because the field is optional and older project JSON stays valid.

- [ ] **Step 4: Add toolbar review actions**

In `apps/web/src/components/EditablePreview.tsx`, add:

```tsx
function setActiveBlockReviewStatus(
  reviewStatus: TextBlock["reviewStatus"],
): void {
  if (!activeEditableBlock) {
    return;
  }

  replaceBlock({
    ...activeEditableBlock,
    reviewStatus,
  });
}
```

Render in the preview toolbar:

```tsx
<button
  type="button"
  disabled={!activeEditableBlock}
  onClick={() => setActiveBlockReviewStatus("needs-review")}
>
  Mark Needs Review
</button>
<button
  type="button"
  disabled={!activeEditableBlock}
  onClick={() => setActiveBlockReviewStatus("accepted")}
>
  Accept Block
</button>
```

When rendering each editable block, show a small chip when `block.reviewStatus` exists:

```tsx
{block.reviewStatus ? (
  <span className={`review-chip review-chip-${block.reviewStatus}`}>
    {block.reviewStatus.replace("-", " ")}
  </span>
) : null}
```

- [ ] **Step 5: Show review status in `SectionEditor`**

For editable block labels, include:

```tsx
{block.reviewStatus ? (
  <span className="review-status-label">
    {block.reviewStatus.replace("-", " ")}
  </span>
) : null}
```

- [ ] **Step 6: Add review styles**

Add:

```css
.review-chip,
.review-status-label {
  display: inline-flex;
  width: fit-content;
  border: 1px solid #d7d2c8;
  border-radius: 4px;
  color: #485256;
  font-size: 12px;
  margin-top: 4px;
  padding: 2px 6px;
}

.review-chip-needs-review {
  border-color: #c89134;
  color: #7a4f17;
}

.review-chip-accepted {
  border-color: #6f9f7a;
  color: #2f6f42;
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx packages/core/tests/book.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/src/book.ts apps/web/src/components/EditablePreview.tsx apps/web/src/components/SectionEditor.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: add block review status"
```

---

### Task 8: Add Edit, EPUB Preview, And Reader Preview Modes

**Files:**

- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing preview mode test**

Add to `apps/web/tests/App.test.tsx`:

```tsx
it("switches between edit, EPUB, and reader preview modes", () => {
  render(<App />);

  expect(screen.getByLabelText("Editable EPUB preview")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "EPUB Preview" }));
  expect(screen.getByTitle("EPUB preview")).toBeInTheDocument();
  expect(screen.queryByLabelText("Editable EPUB preview")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Reader Preview" }));
  expect(screen.getByTitle("Reader preview")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(screen.getByLabelText("Editable EPUB preview")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because preview mode buttons do not exist.

- [ ] **Step 3: Add preview mode state**

In `apps/web/src/App.tsx`, import:

```tsx
import {
  createPreviewDocument,
  renderSectionFragment,
} from "@epub-creator/renderer";
```

Add:

```tsx
type PreviewMode = "edit" | "epub" | "reader";

const [previewMode, setPreviewMode] = useState<PreviewMode>("edit");
```

Add local CSS constants:

```tsx
const EPUB_PREVIEW_CSS = "body { font-family: serif; line-height: 1.55; margin: 2rem; }";
const READER_PREVIEW_CSS =
  "body { font-family: Georgia, serif; font-size: 18px; line-height: 1.7; margin: 0 auto; max-width: 680px; padding: 2rem; }";
```

- [ ] **Step 4: Render segmented preview mode buttons**

Inside `.preview-header`, render:

```tsx
<div className="segmented-control" aria-label="Preview mode">
  {(["edit", "epub", "reader"] as const).map((mode) => (
    <button
      key={mode}
      type="button"
      aria-pressed={previewMode === mode}
      onClick={() => setPreviewMode(mode)}
    >
      {mode === "edit"
        ? "Edit"
        : mode === "epub"
          ? "EPUB Preview"
          : "Reader Preview"}
    </button>
  ))}
</div>
```

- [ ] **Step 5: Render iframes for read-only modes**

Replace the single `EditablePreview` render with:

```tsx
{previewSection && previewMode === "edit" ? (
  <EditablePreview
    project={activeProject}
    section={previewSection}
    onSectionChange={handleSectionChange}
  />
) : null}
{previewSection && previewMode !== "edit" ? (
  <iframe
    className="preview-frame"
    title={previewMode === "epub" ? "EPUB preview" : "Reader preview"}
    srcDoc={createPreviewDocument(
      activeProject,
      renderSectionFragment(activeProject, previewSection),
      previewMode === "epub" ? EPUB_PREVIEW_CSS : READER_PREVIEW_CSS,
    )}
  />
) : null}
```

- [ ] **Step 6: Add preview mode styles**

Add:

```css
.segmented-control {
  display: inline-flex;
  gap: 0;
  border: 1px solid #cfc7bb;
  border-radius: 4px;
  overflow: hidden;
}

.segmented-control button {
  border: 0;
  border-right: 1px solid #cfc7bb;
  background: #ffffff;
  color: #485256;
  cursor: pointer;
  padding: 6px 8px;
}

.segmented-control button:last-child {
  border-right: 0;
}

.segmented-control button[aria-pressed="true"] {
  background: #f3efe7;
  color: #1f2528;
  font-weight: 650;
}

.preview-frame {
  width: 100%;
  min-height: 640px;
  border: 1px solid #d7d2c8;
  border-radius: 4px;
  background: #ffffff;
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add apps/web/src/App.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: add preview mode toggle"
```

---

### Task 9: Add Google Docs-Like Keyboard Shortcuts And Shortcut Dialog

**Files:**

- Create: `apps/web/src/components/ShortcutsDialog.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `apps/web/tests/App.test.tsx`

- [ ] **Step 1: Write the failing keyboard shortcut test**

Add to `apps/web/tests/App.test.tsx`:

```tsx
it("supports save, find, undo, redo, and shortcuts dialog keybindings", async () => {
  saveProjectMock.mockResolvedValue({
    status: "saved",
    project: "/tmp/Imported.epubproj",
  });

  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: "Trigger DOCX Import" }));
  expect(
    await screen.findByRole("heading", { name: "Imported Through App State" }),
  ).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "f", metaKey: true });
  expect(screen.getByLabelText("Find")).toHaveFocus();

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Shortcut Title" },
  });
  fireEvent.keyDown(window, { key: "s", metaKey: true });
  expect(saveProjectMock).toHaveBeenCalled();

  fireEvent.keyDown(window, { key: "z", metaKey: true });
  expect(
    screen.getByRole("heading", { name: "Imported Through App State" }),
  ).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "/", metaKey: true });
  expect(
    screen.getByRole("dialog", { name: "Keyboard Shortcuts" }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: FAIL because keybindings and dialog do not exist.

- [ ] **Step 3: Add `ShortcutsDialog`**

Create `apps/web/src/components/ShortcutsDialog.tsx`:

```tsx
interface ShortcutsDialogProps {
  onClose: () => void;
}

const SHORTCUTS = [
  ["Save", "Cmd/Ctrl+S"],
  ["Find", "Cmd/Ctrl+F"],
  ["Undo", "Cmd/Ctrl+Z"],
  ["Redo", "Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y"],
  ["Keyboard shortcuts", "Cmd/Ctrl+/"],
];

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  return (
    <div className="dialog-backdrop">
      <section
        aria-labelledby="shortcuts-heading"
        className="dialog"
        role="dialog"
      >
        <h2 id="shortcuts-heading">Keyboard Shortcuts</h2>
        <dl className="shortcut-list">
          {SHORTCUTS.map(([label, shortcut]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{shortcut}</dd>
            </div>
          ))}
        </dl>
        <div className="button-row">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add keydown handler in `App`**

Add state:

```tsx
const [shortcutsOpen, setShortcutsOpen] = useState(false);
```

Add effect:

```tsx
useEffect(() => {
  function handleKeyDown(event: KeyboardEvent): void {
    const command = event.metaKey || event.ctrlKey;

    if (!command) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "s") {
      event.preventDefault();
      void saveCurrentProject();
      return;
    }

    if (key === "f") {
      event.preventDefault();
      document.getElementById("find-replace-query")?.focus();
      return;
    }

    if (key === "z" && event.shiftKey) {
      event.preventDefault();
      redoProjectChange();
      return;
    }

    if (key === "z") {
      event.preventDefault();
      undoProjectChange();
      return;
    }

    if (key === "y") {
      event.preventDefault();
      redoProjectChange();
      return;
    }

    if (key === "/") {
      event.preventDefault();
      setShortcutsOpen(true);
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => window.removeEventListener("keydown", handleKeyDown);
}, [activeProject, projectFolderPath]);
```

Render:

```tsx
{shortcutsOpen ? (
  <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
) : null}
```

Add toolbar/topbar buttons for mouse users:

```tsx
<div className="topbar-actions">
  <button type="button" onClick={undoProjectChange}>
    Undo
  </button>
  <button type="button" onClick={redoProjectChange}>
    Redo
  </button>
  <button type="button" onClick={() => setShortcutsOpen(true)}>
    Shortcuts
  </button>
</div>
```

- [ ] **Step 5: Add dialog styles**

Add:

```css
.topbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.topbar-actions button {
  min-height: 34px;
  border: 1px solid #cfc7bb;
  border-radius: 4px;
  background: #fbfaf7;
  color: #1f2528;
  cursor: pointer;
  padding: 6px 8px;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background: rgb(31 37 40 / 35%);
  padding: 16px;
}

.dialog {
  width: min(420px, 100%);
  border: 1px solid #d7d2c8;
  border-radius: 6px;
  background: #ffffff;
  padding: 16px;
}

.shortcut-list {
  display: grid;
  gap: 8px;
  margin: 0 0 16px;
}

.shortcut-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.shortcut-list dd {
  margin: 0;
  color: #626c70;
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm test apps/web/tests/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add apps/web/src/components/ShortcutsDialog.tsx apps/web/src/App.tsx apps/web/src/styles.css apps/web/tests/App.test.tsx
git commit -m "feat: add docs style shortcuts"
```

---

### Task 10: Final Integration, Accessibility, And Verification

**Files:**

- Modify: `apps/web/src/styles.css`
- Modify: `README.md` if the feature summary needs a short local workflow note.
- Test: all changed tests.

- [ ] **Step 1: Add responsive layout guards**

Add:

```css
@media (max-width: 1100px) {
  .workspace-grid {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .stack {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .preview-header,
  .topbar {
    display: grid;
    gap: 10px;
  }

  .segmented-control,
  .topbar-actions {
    width: 100%;
  }

  .segmented-control button,
  .topbar-actions button {
    flex: 1;
  }
}
```

- [ ] **Step 2: Run full verification**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 3: Run acceptance check**

Run:

```bash
pnpm acceptance
```

Expected: command exits 0. If it fails because the acceptance script expects old UI text, update the script to assert the new stable UI landmarks instead of deleting the check.

- [ ] **Step 4: Start the dev server for manual smoke**

Run:

```bash
pnpm dev
```

Open the Vite URL and manually verify:

- Import panel still renders.
- Outline shows section headings.
- Editing in preview still updates sidebar.
- Find/replace changes preview text.
- Autosave status changes after a project-path-backed edit.
- Version history panel reports a helpful message when no project folder is set.
- Preview mode toggles do not overlap controls at desktop or mobile widths.

- [ ] **Step 5: Final commit**

Run:

```bash
git status --short
```

Stage only files changed for this feature set. Because this worktree already contains unrelated uncommitted changes, use explicit paths from the tasks above instead of broad directory adds. Then run:

```bash
git commit -m "feat: improve google docs adaptation"
```

## Self-Review

- Spec coverage: all ten requested feature ideas map to one or more tasks in `Feature To Task Map`.
- Placeholder scan: no unfinished placeholder markers remain.
- Type consistency: `BookProject`, `BookSection`, `TextBlock`, and `ReviewStatus` names match existing package conventions.
- YAGNI check: no new editor dependency, no cloud sync, no collaboration server, and no full tracked-changes model.
