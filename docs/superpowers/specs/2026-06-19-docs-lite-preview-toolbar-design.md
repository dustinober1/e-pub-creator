# Docs-Lite Preview Toolbar Design

## Goal

Make the preview editor feel more like Google Docs by moving the common editing controls into a compact toolbar at the top of the preview pane.

## Scope

- Add a toolbar directly above the editable preview content.
- Track the focused preview block.
- Let users change the focused block kind from the toolbar.
- Let users insert a scene break after the focused block.
- Keep metadata, project save/export, section role, and table-of-contents settings in the existing sidebar.
- Do not add inline bold, italic, fonts, alignment, comments, collaboration, or history.

## Toolbar Controls

- Block kind select: `paragraph`, `heading`, `chapter-title`, `blockquote`, `epigraph`, `letter`, `email`, `message`, `poem`, `footnote`, `endnote`.
- Heading level select, enabled only when the focused block is a heading.
- Insert scene break button.

The section title is editable in preview but is not treated as a block for toolbar commands.

## Architecture

Extend `EditablePreview` with focus tracking and toolbar callbacks. `App` remains the only owner of `BookProject` state through the existing `handleSectionChange` path.

The toolbar receives the selected section, active block id, and update callbacks. It never owns book state.

## Data Flow

1. User focuses an editable preview block.
2. `EditablePreview` stores that block id locally.
3. Toolbar reads the focused block from the current section.
4. Changing block kind or heading level calls `onSectionChange` with an updated section.
5. Inserting a scene break inserts a new scene-break block after the focused block, or at the end if no block is focused.

## Testing

Add focused React tests that prove:

- The toolbar appears above the editable preview.
- Focusing a paragraph and changing the block kind updates the preview and sidebar label.
- Heading level changes only apply to heading blocks.
- Insert scene break adds a read-only scene break after the focused block.
