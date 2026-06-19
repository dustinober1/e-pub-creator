import type { BookSection } from "@epub-creator/core/book";

interface BookOutlineProps {
  sections: BookSection[];
  selectedSectionId?: string;
  onSelectSection?: (sectionId: string) => void;
}

export function BookOutline({ sections, selectedSectionId, onSelectSection }: BookOutlineProps) {
  return (
    <nav className="panel outline-panel" aria-label="Book outline">
      <h2>Book Outline</h2>
      <ol className="outline-list">
        {sections.map((section) => (
          <li key={section.id} className="outline-item">
            <button
              type="button"
              className="outline-title"
              aria-current={section.id === selectedSectionId ? "true" : undefined}
              onClick={() => onSelectSection?.(section.id)}
            >
              {section.title}
            </button>
            <span className="outline-role">{section.role}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
