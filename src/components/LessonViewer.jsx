export default function LessonViewer({ lessonData, slideIndex = 0, compact = false }) {
  const uploaded = lessonData.pdf || null;

  if (!uploaded) {
    return (
      <section className={`lesson-viewer no-slides ${compact ? 'compact' : ''}`}>
        <h2>No slides uploaded</h2>
      </section>
    );
  }

  if (uploaded.type === 'pptx') {
    const slide = uploaded.slides?.[slideIndex] || uploaded.slides?.[0];
    return (
      <section className={`lesson-viewer uploaded-pptx ${compact ? 'compact' : ''}`}>
        <div className="pptx-slide">
          <div className="slide-kicker">PPTX slide {slideIndex + 1} of {uploaded.slides?.length || 1}</div>
          <h2>{slide?.title || uploaded.name}</h2>
          {slide?.lines?.length ? (
            <ul>
              {slide.lines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
            </ul>
          ) : (
            <p>No readable text found on this slide.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={`lesson-viewer uploaded-pdf ${compact ? 'compact' : ''}`}>
      <div className="pdf-slide-frame">
        <iframe title={uploaded.name || 'Uploaded presentation PDF'} src={`${uploaded.dataUrl}#page=${slideIndex + 1}&toolbar=0&navpanes=0`} />
      </div>
    </section>
  );
}
