export default function BrowserPdfViewer({ documentUrl, title = 'Uploaded PDF', page = 1 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const separator = documentUrl?.includes('#') ? '&' : '#';
  const viewerOptions = `toolbar=1&navpanes=1&scrollbar=1&view=FitH&page=${safePage}`;

  return (
    <iframe
      className="pdf-viewer"
      src={`${documentUrl}${separator}${viewerOptions}`}
      title={title}
    />
  );
}
