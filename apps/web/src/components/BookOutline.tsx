import type { BookSection } from "@epub-creator/core/book";

interface BookOutlineProps {
  sections: BookSection[];
  selectedSectionId?: string;
  onMoveSection?: (sectionId: string, direction: -1 | 1) => void;
  onSelectSection?: (sectionId: string) => void;
}

export function BookOutline({
  sections,
  selectedSectionId,
  onMoveSection,
  onSelectSection,
}: BookOutlineProps) {
  return (
    <nav className="panel outline-panel" aria-label="Book outline">
      <h2>Book Outline</h2>
      <ol className="outline-list">
        {sections.map((section, index) => {
          const headingBlocks = section.blocks.filter(
            (block) => block.kind === "heading",
          );

          return (
            <li key={section.id} className="outline-item">
              <div className="outline-item-header">
                <button
                  type="button"
                  className="outline-title"
                  aria-current={
                    section.id === selectedSectionId ? "true" : undefined
                  }
                  onClick={() => onSelectSection?.(section.id)}
                >
                  {section.title}
                </button>
                <span className="outline-role">{section.role}</span>
              </div>
              {onMoveSection ? (
                <div
                  className="outline-actions"
                  aria-label={`${section.title} section actions`}
                >
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveSection(section.id, -1)}
                  >
                    Move {section.title} up
                  </button>
                  <button
                    type="button"
                    disabled={index === sections.length - 1}
                    onClick={() => onMoveSection(section.id, 1)}
                  >
                    Move {section.title} down
                  </button>
                </div>
              ) : null}
              {headingBlocks.length > 0 ? (
                <ol className="outline-heading-list">
                  {headingBlocks.map((block, headingIndex) => (
                    <li key={`${section.id}-${block.id}-${headingIndex}`}>
                      <button
                        type="button"
                        className="outline-heading"
                        onClick={() => onSelectSection?.(section.id)}
                      >
                        {block.text}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
