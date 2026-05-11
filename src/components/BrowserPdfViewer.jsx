import { useEffect, useState } from 'react';

export default function BrowserPdfViewer({ documentUrl, title = 'Uploaded PDF', page = 1 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const separator = documentUrl?.includes('#') ? '&' : '#';
  const viewerOptions = `page=${safePage}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
  const targetSrc = documentUrl ? `${documentUrl}${separator}${viewerOptions}` : '';
  const [currentSrc, setCurrentSrc] = useState(targetSrc);
  const [pendingSrc, setPendingSrc] = useState(null);

  useEffect(() => {
    if (!targetSrc) return;
    if (!currentSrc) {
      setCurrentSrc(targetSrc);
      return;
    }
    if (targetSrc === currentSrc) {
      setPendingSrc(null);
      return;
    }
    setPendingSrc(targetSrc);
  }, [currentSrc, targetSrc]);

  if (!documentUrl) {
    return (
      <section className="lesson-viewer no-slides">
        <h2>Upload the PDF again.</h2>
      </section>
    );
  }

  return (
    <div className="pdf-viewer-stack">
      <iframe
        className="pdf-viewer pdf-viewer-current"
        src={currentSrc}
        title={title}
      />
      {pendingSrc && (
        <iframe
          key={pendingSrc}
          className="pdf-viewer pdf-viewer-pending"
          src={pendingSrc}
          title={`${title} loading`}
          onLoad={() => {
            setCurrentSrc(pendingSrc);
            setPendingSrc(null);
          }}
        />
      )}
    </div>
  );
}
