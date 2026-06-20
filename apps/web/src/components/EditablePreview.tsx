import {
  createElement,
  type ChangeEvent,
  type FocusEvent,
  useState,
} from "react";
import {
  createTextBlock,
  type HeadingLevel,
  type PlainTextBlockKind,
  type TextBlockKind,
} from "@epub-creator/core/book";
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

type ToolbarBlockKind = Exclude<TextBlockKind, "image" | "scene-break">;

const TOOLBAR_BLOCK_KINDS: ToolbarBlockKind[] = [
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

export function EditablePreview({
  project,
  section,
  onSectionChange,
}: EditablePreviewProps) {
  const [activeBlockId, setActiveBlockId] = useState<string>();
  const activeBlock = section.blocks.find(
    (block) => block.id === activeBlockId,
  );
  const activeEditableBlock =
    activeBlock && isEditableBlock(activeBlock) ? activeBlock : undefined;
  const activeHeadingLevel =
    activeEditableBlock?.kind === "heading"
      ? String(activeEditableBlock.level)
      : "";

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

  function replaceBlock(block: TextBlock): void {
    onSectionChange({
      ...section,
      blocks: section.blocks.map((candidate) =>
        candidate.id === block.id ? block : candidate,
      ),
    });
  }

  function changeActiveBlockKind(event: ChangeEvent<HTMLSelectElement>): void {
    if (!activeEditableBlock) {
      return;
    }

    replaceBlock(
      convertBlockKind(
        activeEditableBlock,
        event.target.value as ToolbarBlockKind,
      ),
    );
  }

  function changeActiveHeadingLevel(
    event: ChangeEvent<HTMLSelectElement>,
  ): void {
    if (activeEditableBlock?.kind !== "heading") {
      return;
    }

    replaceBlock({
      ...activeEditableBlock,
      level: Number(event.target.value) as HeadingLevel,
    });
  }

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

  function insertSceneBreak(): void {
    const sceneBreak = createTextBlock("scene-break", "");
    const activeIndex = section.blocks.findIndex(
      (block) => block.id === activeBlockId,
    );
    const insertIndex =
      activeIndex >= 0 ? activeIndex + 1 : section.blocks.length;

    onSectionChange({
      ...section,
      blocks: [
        ...section.blocks.slice(0, insertIndex),
        sceneBreak,
        ...section.blocks.slice(insertIndex),
      ],
    });
  }

  return (
    <div className="preview-editor">
      <div
        className="preview-toolbar"
        role="toolbar"
        aria-label="Preview editing tools"
      >
        <div className="preview-toolbar-group">
          <label htmlFor="preview-block-kind">Block kind</label>
          <select
            id="preview-block-kind"
            aria-label="Block kind"
            value={activeEditableBlock?.kind ?? ""}
            disabled={!activeEditableBlock}
            onChange={changeActiveBlockKind}
          >
            <option value="">Select block</option>
            {TOOLBAR_BLOCK_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
        <div className="preview-toolbar-group">
          <label htmlFor="preview-heading-level">Heading level</label>
          <select
            id="preview-heading-level"
            aria-label="Heading level"
            value={activeHeadingLevel}
            disabled={activeEditableBlock?.kind !== "heading"}
            onChange={changeActiveHeadingLevel}
          >
            <option value="">Level</option>
            {HEADING_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
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
        <button type="button" onClick={insertSceneBreak}>
          Insert scene break
        </button>
      </div>
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
            renderPreviewBlock(
              project,
              block,
              index,
              activeBlockId,
              setActiveBlockId,
              updateBlock,
            ),
          )}
        </section>
      </article>
    </div>
  );
}

function convertBlockKind(block: TextBlock, kind: ToolbarBlockKind): TextBlock {
  const common = {
    id: block.id,
    text: block.text,
    noteId: block.noteId,
    reviewStatus: block.reviewStatus,
    style: block.style,
  };

  if (kind === "heading") {
    return {
      ...common,
      kind,
      level: block.kind === "heading" ? block.level : 2,
    };
  }

  return {
    ...common,
    kind: kind as PlainTextBlockKind,
  };
}

function renderPreviewBlock(
  project: BookProject,
  block: TextBlock,
  index: number,
  activeBlockId: string | undefined,
  onFocus: (blockId: string) => void,
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
    "div",
    {
      key: block.id,
      className: "preview-block",
    },
    block.reviewStatus
      ? createElement(
          "span",
          {
            className: `review-chip review-chip-${block.reviewStatus}`,
          },
          formatReviewStatus(block.reviewStatus),
        )
      : null,
    createElement(
      tagNameFor(block),
      {
        "aria-label": label,
        className: classNameFor(block, classNameBaseFor(block)),
        contentEditable: true,
        "data-active": block.id === activeBlockId ? "true" : undefined,
        suppressContentEditableWarning: true,
        onFocus: () => onFocus(block.id),
        onBlur: (event: FocusEvent<HTMLElement>) =>
          onBlur(block, readEditableText(event.currentTarget)),
      },
      block.text,
    ),
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

function formatReviewStatus(
  reviewStatus: NonNullable<TextBlock["reviewStatus"]>,
): string {
  return reviewStatus.replace("-", " ");
}
