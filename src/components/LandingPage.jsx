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
    <main className="home-page">
      <section className="home-panel">
        <div>
          <h1>Cancer Treatments Interactive Lesson</h1>
          <p>Advanced Biology Capstone</p>
        </div>
        <label className="room-code-field">
          Room Code
          <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} />
        </label>
        <div className="home-actions">
          <button className="button primary large" onClick={onStudent}>
            Join as Student
          </button>
          <button className="button secondary large" onClick={onPresenter}>
            Presenter Login
          </button>
        </div>
        <div className="system-line">
          <span className={`status-dot ${connected ? 'online' : ''}`} />
          {connected ? 'Realtime server connected' : 'Connecting to realtime server'}
        </div>
      </section>
      <footer className="app-footer">
        <span>{lessonData.footerDisclaimer}</span>
        <button className="dev-link" onClick={onDev}>Dev</button>
      </footer>
    </main>
  );
}
