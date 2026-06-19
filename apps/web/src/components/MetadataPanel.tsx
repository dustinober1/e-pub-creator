import type { BookMetadata } from "@epub-creator/core/book";

interface MetadataPanelProps {
  metadata: Pick<BookMetadata, "title" | "author" | "language">;
  onChange?: (
    metadata: Pick<BookMetadata, "title" | "author" | "language">,
  ) => void;
}

export function MetadataPanel({ metadata, onChange }: MetadataPanelProps) {
  return (
    <section className="panel" aria-labelledby="metadata-heading">
      <h2 id="metadata-heading">Metadata</h2>
      <div className="metadata-list">
        <label className="editor-field">
          <span>Title</span>
          <input
            type="text"
            value={metadata.title}
            onChange={(event) =>
              onChange?.({ ...metadata, title: event.target.value })
            }
          />
        </label>
        <label className="editor-field">
          <span>Author</span>
          <input
            type="text"
            value={metadata.author}
            onChange={(event) =>
              onChange?.({ ...metadata, author: event.target.value })
            }
          />
        </label>
        <label className="editor-field">
          <span>Language</span>
          <input
            type="text"
            value={metadata.language}
            onChange={(event) =>
              onChange?.({ ...metadata, language: event.target.value })
            }
          />
        </label>
      </div>
    </section>
  );
}
