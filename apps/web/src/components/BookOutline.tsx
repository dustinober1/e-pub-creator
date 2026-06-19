import type { BookSection } from "@epub-creator/core/book";

interface BookOutlineProps {
  sections: BookSection[];
}

export function BookOutline({ sections }: BookOutlineProps) {
  return (
    <nav className="panel outline-panel" aria-label="Book outline">
      <h2>Book Outline</h2>
      <ol className="outline-list">
        {sections.map((section) => (
          <li key={section.id} className="outline-item">
            <span className="outline-title">{section.title}</span>
            <span className="outline-role">{section.role}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
