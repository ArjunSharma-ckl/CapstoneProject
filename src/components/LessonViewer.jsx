import NutrientPdfViewer from './NutrientPdfViewer.jsx';

export default function LessonViewer({ lessonData, slideIndex = 0, compact = false }) {
  const uploaded = lessonData.pdf || null;
  const slides = lessonData.slides || [];

  // PDF / PPTX takes priority when uploaded
  if (uploaded) {
    if (uploaded.type === 'pptx') {
      const slide = uploaded.slides?.[slideIndex] || uploaded.slides?.[0];
      return (
        <section className={`lesson-viewer uploaded-pptx ${compact ? 'compact' : ''}`}>
          <div className="pptx-slide">
            <div className="slide-kicker">Slide {slideIndex + 1} of {uploaded.slides?.length || 1}</div>
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

    const page = Math.max(1, Number(slideIndex) + 1);
    return (
      <NutrientPdfViewer
        title={uploaded.name || 'Uploaded PDF'}
        documentUrl={uploaded.dataUrl}
        pageIndex={page - 1}
      />
    );
  }

  // Built-in slides
  if (slides.length > 0) {
    const sorted = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const slide = sorted[Math.min(slideIndex, sorted.length - 1)];
    if (!slide) {
      return (
        <section className={`lesson-viewer no-slides ${compact ? 'compact' : ''}`}>
          <h2>No slide at this index.</h2>
        </section>
      );
    }
    return (
      <section className={`lesson-viewer builtin-slide ${compact ? 'compact' : ''}`}>
        <div className="slide-kicker">Slide {slideIndex + 1} of {sorted.length}</div>
        <h2 className="slide-title">{slide.title}</h2>
        {slide.focus && <div className="slide-focus">{slide.focus}</div>}
        <p className="slide-description">{slide.description}</p>
      </section>
    );
  }

  return (
    <section className={`lesson-viewer no-slides ${compact ? 'compact' : ''}`}>
      <h2>No slides loaded.</h2>
      <p>Upload a PDF or PPTX, or add slides in the Edit tab.</p>
    </section>
  );
}
