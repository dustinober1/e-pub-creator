import type { BookMetadata } from "@epub-creator/core/book";

interface MetadataPanelProps {
  metadata: Pick<BookMetadata, "title" | "author" | "language">;
}

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  return (
    <section className="panel" aria-labelledby="metadata-heading">
      <h2 id="metadata-heading">Metadata</h2>
      <dl className="metadata-list">
        <div>
          <dt>Title</dt>
          <dd>{metadata.title}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>{metadata.author}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{metadata.language}</dd>
        </div>
      </dl>
    </section>
  );
}
