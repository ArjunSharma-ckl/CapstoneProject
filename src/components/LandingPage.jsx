export default function LandingPage({
  roomCode,
  setRoomCode,
  onPresenter,
  onStudent
}) {
  return (
    <main className="home-page">
      <section className="home-panel">
        <label className="room-code-field control-only">
          <input
            aria-label="Room code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ENTER CODE HERE"
          />
        </label>
        <div className="home-actions">
          <button className="button primary large" onClick={onStudent} disabled={!roomCode.trim()}>
            Join as Student
          </button>
          <button className="button secondary large" onClick={onPresenter} disabled={!roomCode.trim()}>
            Presenter Login
          </button>
        </div>
      </section>
    </main>
  );
}
