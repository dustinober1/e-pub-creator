import type {
  BookSection,
  SectionRole,
  TextBlock,
} from "@epub-creator/core/book";

interface SectionEditorProps {
  section: BookSection;
  onChange: (section: BookSection) => void;
}

const SECTION_ROLES: SectionRole[] = ["front", "body", "back"];

export function SectionEditor({ section, onChange }: SectionEditorProps) {
  function updateBlock(blockId: string, text: string): void {
    onChange({
      ...section,
      blocks: section.blocks.map((block) =>
        block.id === blockId ? { ...block, text } : block,
      ),
    });
  }

  return (
    <section
      className="panel section-editor"
      aria-labelledby="section-editor-heading"
    >
      <h2 id="section-editor-heading">Section Editor</h2>
      <div className="section-editor-controls">
        <label className="editor-field">
          <span>Section title</span>
          <input
            type="text"
            value={section.title}
            onChange={(event) =>
              onChange({ ...section, title: event.target.value })
            }
          />
        </label>
        <label className="editor-field">
          <span>Section role</span>
          <select
            value={section.role}
            onChange={(event) =>
              onChange({
                ...section,
                role: event.target.value as SectionRole,
              })
            }
          >
            {SECTION_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-checkbox">
          <input
            type="checkbox"
            checked={section.includeInToc}
            onChange={(event) =>
              onChange({ ...section, includeInToc: event.target.checked })
            }
          />
          <span>Include in table of contents</span>
        </label>
      </div>
      <div className="section-blocks">
        {section.blocks.map((block, index) =>
          isEditableBlock(block) ? (
            <label key={block.id} className="editor-field">
              <span>{`Block ${index + 1} (${block.kind})`}</span>
              {block.reviewStatus ? (
                <span className={`review-status-label review-status-${block.reviewStatus}`}>
                  {formatReviewStatus(block.reviewStatus)}
                </span>
              ) : null}
              <textarea
                value={block.text}
                onChange={(event) => updateBlock(block.id, event.target.value)}
                rows={5}
              />
            </label>
          ) : (
            <div key={block.id} className="readonly-block-row">
              <span className="readonly-block-kind">{`Block ${index + 1} (${block.kind})`}</span>
              {block.reviewStatus ? (
                <span className={`review-status-label review-status-${block.reviewStatus}`}>
                  {formatReviewStatus(block.reviewStatus)}
                </span>
              ) : null}
              <span className="readonly-block-summary">
                {summarizeReadOnlyBlock(block)}
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function isEditableBlock(block: TextBlock): boolean {
  return block.kind !== "scene-break" && block.kind !== "image";
}

function summarizeReadOnlyBlock(block: TextBlock): string {
  if (block.kind === "scene-break") {
    return "Scene break";
  }

  if (block.kind === "image") {
    return block.text || "Image block";
  }

  return block.text;
}

function formatReviewStatus(
  reviewStatus: NonNullable<TextBlock["reviewStatus"]>,
): string {
  return reviewStatus.replace("-", " ");
}
