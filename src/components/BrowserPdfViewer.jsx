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
  const viewerOptions = `toolbar=0&navpanes=0&scrollbar=0&page=${safePage}&view=Fit&zoom=page-fit`;

  return (
    <iframe
      key={`${documentUrl}-${safePage}`}
      className="pdf-viewer"
      src={`${documentUrl}${separator}${viewerOptions}`}
      title={title}
    />
  );
}
