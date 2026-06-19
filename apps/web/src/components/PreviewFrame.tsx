interface PreviewFrameProps {
  srcDoc: string;
}

export function PreviewFrame({ srcDoc }: PreviewFrameProps) {
  return <iframe className="preview-frame" title="EPUB XHTML preview" srcDoc={srcDoc} />;
}
