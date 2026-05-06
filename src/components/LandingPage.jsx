export default function LandingPage({ roomCode, setRoomCode, onPresenter, onStudent }) {
  const hasCode = roomCode.trim().length > 0;

  return (
    <main className="home-page">
      <section className="home-panel">
        <label className="room-code-field control-only">
          <input
            id="room-code-input"
            aria-label="Room code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase().trim())}
            placeholder="ENTER ROOM CODE HERE"
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </label>
        <div className="home-actions">
          <button
            id="join-student-btn"
            className="button primary large"
            onClick={onStudent}
            disabled={!hasCode}
          >
            Join as Student
          </button>
          <button
            id="presenter-login-btn"
            className="button secondary large"
            onClick={onPresenter}
            disabled={!hasCode}
          >
            Presenter Login
          </button>
        </div>
      </section>
    </main>
  );
}
