# Inline Preview Editing Design

## Goal

Let users edit the currently selected section directly in the preview pane. Edits must update the existing `BookProject` state so save, export, outline, and the sidebar editor use the same data.

## Scope

- Replace the app-only preview iframe with React-rendered preview content for the selected section.
- Make editable text blocks editable in place.
- Commit preview edits on blur.
- Keep scene breaks and images read-only.
- Keep metadata, section role, table-of-contents settings, and project actions in the existing sidebar controls.
- Preserve the renderer package output path for EPUB/export rendering.

## Editable Targets

- Section title.
- Text blocks with these kinds: `paragraph`, `epigraph`, `blockquote`, `letter`, `email`, `message`, `poem`, `footnote`, `endnote`, `heading`, and `chapter-title`.

Scene breaks and images remain visible but not editable in preview.

## Architecture

Add a small `EditablePreview` React component under `apps/web/src/components`. It receives the selected `BookProject`, selected `BookSection`, and an `onSectionChange` callback. The component renders preview markup directly from section data and calls `onSectionChange` with updated section copies.

This keeps one state owner: `App`. The sidebar `SectionEditor`, outline, save, and export continue reading the same `activeProject` state.

## Data Flow

1. `App` finds the selected section.
2. `EditablePreview` renders that section.
3. User edits a contenteditable title or block.
4. On blur, `EditablePreview` compares text and calls `onSectionChange` only when text changed.
5. `App` updates `activeProject.sections` with the changed section.

## Error Handling

The preview does not attempt to repair unsupported blocks. Unsupported/read-only blocks render a simple label or summary. Empty editable fields are allowed because the existing sidebar allows empty text values.

## Testing

Add focused React tests that:

- Editing preview body text updates the sidebar block textarea and the saved/exported state path.
- Editing the preview section title updates the outline and sidebar section title.
- Scene breaks remain non-editable in preview.
