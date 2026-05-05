export default function LandingPage({
  lessonData,
  roomCode,
  setRoomCode,
  onPresenter,
  onStudent,
  onDev
}) {
  return (
    <main className="home-page">
      <section className="home-panel">
        <div className="home-heading">
          <h1>Cancer Treatments Interactive Lesson</h1>
          <p>Advanced Biology Capstone</p>
        </div>
        <label className="room-code-field">
          Room Code
          <input
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="BIO123"
          />
        </label>
        <div className="home-actions">
          <button className="button primary large" onClick={onStudent}>
            Join as Student
          </button>
          <button className="button secondary large" onClick={onPresenter}>
            Presenter Login
          </button>
        </div>
      </section>
      <footer className="app-footer">
        <span>{lessonData.footerDisclaimer}</span>
        <button className="dev-link" onClick={onDev}>Dev</button>
      </footer>
    </main>
  );
}
