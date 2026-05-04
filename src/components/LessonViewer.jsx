export default function LessonViewer({ lessonData, slideIndex = 0, animation, compact = false }) {
  const slides = [...(lessonData.slides || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const slide = slides[slideIndex] || slides[0];
  const animationType = animation?.type || slide?.animationType || 'cancer-cells';

  // PDF.js or a static PDF embed can be connected here later as a slide background.
  // The React overlay animation intentionally remains separate so presenter-triggered
  // effects stay editable and synced without trying to animate the PDF itself.
  if (!slide) {
    return <section className="lesson-viewer empty-state">No lesson slides are available.</section>;
  }

  return (
    <section className={`lesson-viewer ${compact ? 'compact' : ''}`}>
      <div className="slide-copy">
        <div className="slide-kicker">Slide {slideIndex + 1} of {slides.length} · {slide.focus}</div>
        <h2>{slide.title}</h2>
        <p>{slide.description}</p>
      </div>
      <OverlayAnimation type={animationType} nonce={animation?.nonce} />
    </section>
  );
}

function OverlayAnimation({ type, nonce }) {
  return (
    <div className={`overlay-animation anim-${type}`} data-nonce={nonce}>
      <svg viewBox="0 0 520 300" role="img" aria-label={`${type} biology diagram`}>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#0d5f57" />
          </marker>
        </defs>
        <rect className="diagram-bg" x="20" y="24" width="480" height="252" rx="22" />
        <g className="cells">
          <circle className="cancer-cell main" cx="250" cy="148" r="42" />
          <circle className="cancer-cell small one" cx="195" cy="112" r="22" />
          <circle className="cancer-cell small two" cx="316" cy="105" r="20" />
          <circle className="cancer-cell small three" cx="324" cy="198" r="24" />
          <path className="dna" d="M232 142 C248 124, 268 172, 286 150 M232 158 C248 176, 268 128, 286 150" />
        </g>
        <g className="mutation-warning">
          <path d="M378 68 h76 l18 18 v40 h-94 z" />
          <text x="392" y="96">Mutation</text>
        </g>
        <g className="surgery-tool">
          <path d="M110 210 L228 156" />
          <path d="M92 220 l40 -8 l-21 31 z" />
          <rect x="214" y="116" width="92" height="78" rx="16" />
        </g>
        <g className="chemo-flow">
          <path className="vessel" d="M72 88 C170 32, 342 70, 450 48" />
          <circle className="drug d1" cx="106" cy="72" r="8" />
          <circle className="drug d2" cx="172" cy="55" r="7" />
          <circle className="drug d3" cx="240" cy="58" r="6" />
          <rect className="side-meter" x="74" y="230" width="120" height="12" rx="6" />
          <rect className="side-fill" x="74" y="230" width="70" height="12" rx="6" />
        </g>
        <g className="radiation-beam">
          <path className="beam b1" d="M58 72 L220 138" />
          <path className="beam b2" d="M58 112 L218 150" />
          <path className="beam b3" d="M58 152 L220 162" />
          <path className="crack" d="M258 123 l-12 18 l18 7 l-15 24 l24 -22" />
        </g>
        <g className="immune">
          <circle className="tcell t1" cx="105" cy="178" r="18" />
          <circle className="tcell t2" cx="126" cy="120" r="16" />
          <path className="target-line" d="M126 120 L204 132" />
          <path className="shield" d="M214 98 C250 72, 300 88, 316 126 C288 112, 250 110, 214 126 z" />
        </g>
        <g className="pdt">
          <path className="light" d="M420 44 L312 138 L342 166 L470 84 z" />
          <circle className="photo p1" cx="298" cy="124" r="5" />
          <circle className="photo p2" cx="330" cy="150" r="5" />
          <circle className="radical r1" cx="352" cy="118" r="4" />
          <circle className="radical r2" cx="300" cy="190" r="4" />
        </g>
        <g className="research">
          <path d="M95 230 h78 l30 -78 h-46 z" />
          <path d="M154 152 v-58 h44" />
          <circle cx="238" cy="84" r="7" />
          <circle cx="268" cy="104" r="7" />
          <circle cx="298" cy="84" r="7" />
        </g>
      </svg>
    </div>
  );
}
