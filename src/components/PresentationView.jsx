import LessonViewer from './LessonViewer.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';

export default function PresentationView({ roomCode, roomState, lessonData, socket }) {
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId)
    || (roomState?.game?.currentQuestion?.id === roomState?.activeQuestionId ? roomState?.game?.currentQuestion : null);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : lessonData;
  const connectedStudents = roomState?.students?.filter((student) => student.connected) || [];
  const expectedResponses = connectedStudents.length || roomState?.students?.length || 0;
  const everyoneAnswered = Boolean(activeQuestion && expectedResponses > 0 && activeResponses.length >= expectedResponses);
  const correctResponses = activeResponses.filter((response) => response.correct);
  const fastestCorrect = [...correctResponses]
    .filter((response) => Number.isFinite(response.elapsedMs))
    .sort((a, b) => a.elapsedMs - b.elapsedMs)[0];
  const correctLeaderboard = [...correctResponses]
    .sort((a, b) => (a.elapsedMs || 999999) - (b.elapsedMs || 999999));

  function returnToSlide() {
    socket?.emit('presenter:control', {
      roomCode,
      action: 'question:returnToSlide',
      payload: {}
    });
  }

  if (!roomState) {
    return (
      <main className="projection-view waiting">
        <h1>Waiting for presenter</h1>
        <p>Waiting for room {roomCode}</p>
      </main>
    );
  }

  if (roomState.game?.bossHealth === 0) {
    return (
      <main className="projection-view">
        <ResultsScreen lessonData={lessonData} roomState={roomState} />
      </main>
    );
  }

  if (roomState.game?.active) {
    return (
      <main className="projection-view">
        <GameArena
          lessonData={lessonData}
          roomState={roomState}
          activeQuestion={activeQuestion}
          activeResponses={activeResponses}
          presenter
          readOnly
        />
        {activeQuestion && (
          <ProjectionQuestionPanel
            activeQuestion={activeQuestion}
            activeResponses={activeResponses}
            expectedResponses={expectedResponses}
            everyoneAnswered={everyoneAnswered}
            correctResponses={correctResponses}
            fastestCorrect={fastestCorrect}
            correctLeaderboard={correctLeaderboard}
            onNext={returnToSlide}
          />
        )}
      </main>
    );
  }

  return (
    <main className="projection-view">
      <LessonViewer
        lessonData={projectedData}
        slideIndex={roomState.slideIndex}
        animation={roomState.animationOverlay ? roomState.animation : { type: null, nonce: 0 }}
      />
      {activeQuestion && (
        <ProjectionQuestionPanel
          activeQuestion={activeQuestion}
          activeResponses={activeResponses}
          expectedResponses={expectedResponses}
          everyoneAnswered={everyoneAnswered}
          correctResponses={correctResponses}
          fastestCorrect={fastestCorrect}
          correctLeaderboard={correctLeaderboard}
          onNext={returnToSlide}
        />
      )}
    </main>
  );
}

function ProjectionQuestionPanel({
  activeQuestion,
  activeResponses,
  expectedResponses,
  everyoneAnswered,
  correctResponses,
  fastestCorrect,
  correctLeaderboard,
  onNext
}) {
  return (
    <section className="projection-question">
      <button className="button primary projection-next-button" onClick={onNext}>Next</button>
      <h2>{activeQuestion.prompt}</h2>
      {everyoneAnswered ? (
        <div className="projection-results">
          <div className="projection-score">
            <strong>{correctResponses.length}/{expectedResponses}</strong>
            <span>correct</span>
          </div>
          {fastestCorrect && (
            <div className="fastest-correct">
              <span>Fastest correct</span>
              <strong>{fastestCorrect.studentName}</strong>
            </div>
          )}
          <div className="projection-leaderboard">
            {correctLeaderboard.map((response, index) => (
              <div key={response.studentId}>
                <span>{index + 1}. {response.studentName}</span>
                <strong>{formatMs(response.elapsedMs)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="projection-answer-count">
          {activeResponses.length}/{expectedResponses || '?'} answered
        </div>
      )}
    </section>
  );
}

function formatMs(ms) {
  if (!Number.isFinite(ms)) return '';
  return `${(ms / 1000).toFixed(1)}s`;
}
