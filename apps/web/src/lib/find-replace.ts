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

  const needle = trimmed.toLowerCase();
  const matches: FindMatch[] = [];

  for (const section of project.sections) {
    if (section.title.toLowerCase().includes(needle)) {
      matches.push({
        sectionId: section.id,
        text: section.title,
      });
    }

    for (const block of section.blocks) {
      if (!isEditableTextBlock(block)) {
        continue;
      }

      if (block.text.toLowerCase().includes(needle)) {
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
  let changed = false;

  const updated = {
    ...project,
    sections: project.sections.map((section) => ({
      ...section,
      title: replaceWithChangeCheck(section.title, pattern, replacement, () => {
        changed = true;
      }),
      blocks: section.blocks.map((block) =>
        isEditableTextBlock(block)
          ? {
              ...block,
              text: replaceWithChangeCheck(
                block.text,
                pattern,
                replacement,
                () => {
                  changed = true;
                },
              ),
            }
          : block,
      ),
    })),
  };

  return changed ? updated : project;
}

function isEditableTextBlock(block: TextBlock): boolean {
  return block.kind !== "image" && block.kind !== "scene-break";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceWithChangeCheck(
  value: string,
  pattern: RegExp,
  replacement: string,
  markChanged: () => void,
): string {
  const nextValue = value.replace(pattern, () => replacement);

  if (nextValue !== value) {
    markChanged();
  }

  return nextValue;
}
