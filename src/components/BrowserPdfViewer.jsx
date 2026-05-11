export default function BrowserPdfViewer({ documentUrl, title = 'Uploaded PDF', page = 1 }) {
  if (!documentUrl) {
    return (
      <section className="lesson-viewer no-slides">
        <h2>Upload the PDF again.</h2>
      </section>
    );
  }

  const safePage = Math.max(1, Number(page) || 1);
  const separator = documentUrl?.includes('#') ? '&' : '#';
  // Minimal viewer chrome so the page reads like real slides; `key` forces a reload when
  // the page changes (hash-only src updates are ignored by embedded PDF viewers).
  const viewerOptions = `page=${safePage}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;

  return (
    <iframe
      key={`pdf-page-${safePage}`}
      className="pdf-viewer"
      src={`${documentUrl}${separator}${viewerOptions}`}
      title={title}
    />
  );
}
