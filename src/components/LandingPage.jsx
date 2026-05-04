export default function LandingPage({
  lessonData,
  connected,
  roomCode,
  setRoomCode,
  onPresenter,
  onStudent,
  onDev
}) {
  return (
    <main className="landing">
      <section className="landing-grid">
        <div className="hero-copy">
          <div className="eyebrow">Advanced Biology Capstone</div>
          <h1>{lessonData.title}</h1>
          <p>
            A live classroom lesson where students answer questions, earn treatment resources,
            and work together to defeat cancer by matching biology to treatment strategy.
          </p>
          <div className="landing-actions">
            <button className="button primary large" onClick={() => onPresenter(roomCode)}>
              Open Presenter Dashboard
            </button>
            <button className="button secondary large" onClick={onStudent}>
              Join as Student
            </button>
          </div>
          <label className="room-code-field">
            Room code
            <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} />
          </label>
          <div className="system-line">
            <span className={`status-dot ${connected ? 'online' : ''}`} />
            {connected ? 'Realtime server connected' : 'Connecting to realtime server'}
          </div>
        </div>

        <div className="mission-panel" aria-label="Lesson overview">
          <div className="patient-map">
            <div className="organ-outline">
              <span className="cell c1" />
              <span className="cell c2" />
              <span className="cell c3" />
              <span className="tcell t1" />
              <span className="beam-line" />
            </div>
          </div>
          <div className="mission-stats">
            <div><strong>{lessonData.slides.length}</strong><span>lesson screens</span></div>
            <div><strong>{lessonData.questions.length}</strong><span>editable questions</span></div>
            <div><strong>{lessonData.treatments.length}</strong><span>treatment cards</span></div>
          </div>
        </div>
      </section>
      <footer className="app-footer">
        <span>{lessonData.footerDisclaimer}</span>
        <button className="dev-link" onClick={onDev}>Dev</button>
      </footer>
    </main>
  );
}
