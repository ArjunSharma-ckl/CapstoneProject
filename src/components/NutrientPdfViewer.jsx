import { useEffect, useRef, useState } from 'react';

export default function NutrientPdfViewer({ documentUrl, title = 'Uploaded PDF', pageIndex = 0 }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !documentUrl) return undefined;

    let canceled = false;
    let objectUrl = '';

    async function loadViewer() {
      setFailed(false);
      try {
        const NutrientViewer = (await import('@nutrient-sdk/viewer')).default;
        NutrientViewer.unload(container);

        const response = await fetch(documentUrl);
        const blob = await response.blob();
        if (canceled) return;

        objectUrl = URL.createObjectURL(blob);
        const instance = await NutrientViewer.load({
          container,
          document: objectUrl,
          useCDN: true,
          toolbarItems: [
            { type: 'pager' },
            { type: 'zoom-out' },
            { type: 'zoom-in' },
            { type: 'pan' },
            { type: 'search' }
          ]
        });

        instanceRef.current = instance;
      } catch (error) {
        console.error('Nutrient viewer failed to load.', error);
        if (!canceled) setFailed(true);
      }
    }

    loadViewer();

    return () => {
      canceled = true;
      import('@nutrient-sdk/viewer')
        .then((module) => module.default.unload(container))
        .catch(() => {});
      instanceRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentUrl]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance || !Number.isFinite(pageIndex)) return;
    try {
      instance.setViewState((viewState) => viewState.set('currentPageIndex', Math.max(0, pageIndex)));
    } catch {
      // Page syncing is best-effort; the viewer remains usable if this SDK API changes.
    }
  }, [pageIndex]);

  if (failed) {
    return (
      <iframe
        title={title}
        src={`${documentUrl}#page=${Math.max(1, pageIndex + 1)}&view=FitH`}
        className="pdf-viewer"
      />
    );
  }

  return <div ref={containerRef} className="nutrient-pdf-viewer" aria-label={title} />;
}
