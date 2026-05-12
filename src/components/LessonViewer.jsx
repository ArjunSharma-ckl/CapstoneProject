import BrowserPdfViewer from './BrowserPdfViewer.jsx';

export default function LessonViewer({ lessonData, slideIndex = 0, compact = false }) {
  const uploaded = lessonData.pdf || null;
  const slides = lessonData.slides || [];

  if (uploaded?.type === 'pdf') {
    const page = Math.max(1, Number(slideIndex) + 1);
    return (
      <section className={`lesson-viewer uploaded-pdf ${compact ? 'compact' : ''}`}>
        <BrowserPdfViewer
          title={uploaded.name || 'Uploaded PDF'}
          documentUrl={uploaded.url}
          page={page}
        />
      </section>
    );
  }

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
        <div className="slide-content" key={slide.id || slideIndex}>
          <h2 className="slide-title">{slide.title}</h2>
          {slide.focus && <div className="slide-focus">{slide.focus}</div>}
          {slide.description && <p className="slide-description">{slide.description}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className={`lesson-viewer no-slides ${compact ? 'compact' : ''}`}>
      <h2>No slides loaded.</h2>
      <p>Upload a PDF or add slides in the Edit tab.</p>
    </section>
  );
}
