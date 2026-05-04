import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';

export default function PresenterDashboard({
  connected,
  roomCode,
  setRoomCode,
  roomState,
  lessonData,
  onCreateRoom,
  onControl,
  onBack,
  onDev
}) {
  const slides = [...(lessonData.slides || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const slide = slides[roomState?.slideIndex || 0];
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState.activeQuestionId] || [];
  const allResponses = Object.values(roomState?.responses || {}).flat();
  const accuracy = allResponses.length
    ? Math.round((allResponses.filter((response) => response.correct).length / allResponses.length) * 100)
    : 0;

  if (!roomState) {
    return (
      <main className="presenter-setup">
        <div className="setup-card">
          <button className="button ghost back-button" onClick={onBack}>Back</button>
          <div className="eyebrow">Presenter Dashboard</div>
          <h1>Create a classroom room</h1>
          <p>Students will join this room code and receive synced slides, questions, answers, game events, and results.</p>
          <label>
            Room code
            <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} />
          </label>
          <button className="button primary large" onClick={() => onCreateRoom(roomCode)} disabled={!connected}>
            Create Room
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="presenter-dashboard">
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">Presenter control room</div>
          <h1>{lessonData.title}</h1>
        </div>
        <div className="header-actions">
          <span className="room-pill">Room {roomState.roomCode}</span>
          <button className="button secondary" onClick={onDev}>Dev</button>
          <button className="button ghost" onClick={onBack}>Exit</button>
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="control-rail">
          <div className="control-card">
            <h3>Lesson controls</h3>
            <button className="button primary" onClick={() => onControl('lesson:start')}>Start Lesson</button>
            <div className="button-row">
              <button className="button secondary" onClick={() => onControl('slide:previous')}>Previous</button>
              <button className="button secondary" onClick={() => onControl('slide:next')}>Next</button>
            </div>
            <label>
              Jump to slide
              <select value={roomState.slideIndex} onChange={(event) => onControl('slide:set', { index: Number(event.target.value) })}>
                {slides.map((item, index) => (
                  <option value={index} key={item.id}>{index + 1}. {item.title}</option>
                ))}
              </select>
            </label>
            <button className="button secondary" onClick={() => onControl('animation:trigger', { type: slide?.animationType })}>
              Trigger Slide Animation
            </button>
          </div>

          <div className="control-card">
            <h3>Question controls</h3>
            <label>
              Launch question
              <select onChange={(event) => event.target.value && onControl('question:launch', { questionId: event.target.value })} value="">
                <option value="">Choose question...</option>
                {lessonData.questions.map((question, index) => (
                  <option key={question.id} value={question.id}>{index + 1}. {question.prompt}</option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button className="button secondary" onClick={() => onControl('question:reveal')}>Reveal Answer</button>
              <button className="button secondary" onClick={() => onControl('question:clear')}>Clear</button>
            </div>
          </div>

          <div className="control-card danger-zone">
            <h3>Session</h3>
            <button className="button secondary" onClick={() => onControl('game:start', { scenarioId: 'localized-solid' })}>Start Final Game</button>
            <button className="button secondary" onClick={() => onControl('session:reset')}>Reset Session</button>
          </div>
        </aside>

        <section className="main-stage">
          {roomState.game?.bossHealth === 0 ? (
            <ResultsScreen lessonData={lessonData} roomState={roomState} />
          ) : roomState.game?.active ? (
            <GameArena
              lessonData={lessonData}
              roomState={roomState}
              activeQuestion={activeQuestion}
              activeResponses={activeResponses}
              presenter
              onControl={onControl}
            />
          ) : (
            <>
              <LessonViewer lessonData={lessonData} slideIndex={roomState.slideIndex} animation={roomState.animation} />
              {activeQuestion && (
                <QuestionCard
                  question={activeQuestion}
                  revealAnswers={roomState.revealAnswers}
                  responses={activeResponses}
                  mode="presenter"
                />
              )}
            </>
          )}
        </section>

        <aside className="analytics-rail">
          <div className="metric-stack">
            <div className="metric-card"><strong>{roomState.students.length}</strong><span>students</span></div>
            <div className="metric-card"><strong>{accuracy}%</strong><span>accuracy</span></div>
            <div className="metric-card"><strong>{roomState.game?.charges || 0}</strong><span>charges</span></div>
          </div>
          <div className="panel-card">
            <h3>Connected students</h3>
            {roomState.students.length === 0 ? <p className="muted">Waiting for students to join.</p> : (
              roomState.students.map((student) => (
                <div className="student-row" key={student.id}>
                  <span className={`status-dot ${student.connected ? 'online' : ''}`} />
                  <span>{student.name}</span>
                  <strong>{student.score}</strong>
                </div>
              ))
            )}
          </div>
          <div className="panel-card">
            <h3>Responses</h3>
            {activeResponses.length === 0 ? <p className="muted">No responses for the active question yet.</p> : (
              activeResponses.map((response) => (
                <div className="response-row" key={response.studentId}>
                  <span>{response.studentName}</span>
                  <strong className={response.correct ? 'correct-text' : 'incorrect-text'}>
                    {response.correct ? 'Correct' : 'Review'}
                  </strong>
                </div>
              ))
            )}
          </div>
          <ConceptPerformance stats={roomState.conceptStats} />
        </aside>
      </section>
      <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
    </main>
  );
}

function ConceptPerformance({ stats = {} }) {
  const rows = Object.entries(stats);
  return (
    <div className="panel-card">
      <h3>Concept performance</h3>
      {rows.length === 0 ? <p className="muted">Performance appears after answers come in.</p> : rows.map(([concept, stat]) => {
        const pct = Math.round((stat.correct / stat.total) * 100);
        return (
          <div className="concept-meter" key={concept}>
            <div><span>{concept}</span><strong>{pct}%</strong></div>
            <meter min="0" max="100" value={pct} />
          </div>
        );
      })}
    </div>
  );
}
