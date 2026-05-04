import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';

export default function StudentView({ connected, roomCode, studentName, roomState, lessonData, socket, onBack }) {
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const me = roomState?.students?.find((student) => student.name === studentName);

  function answer(payload) {
    socket?.emit('student:answer', {
      roomCode,
      ...payload
    });
  }

  if (!roomState) {
    return (
      <main className="student-screen">
        <section className="student-card">
          <button className="button ghost back-button" onClick={onBack}>Back</button>
          <div className="eyebrow">Room {roomCode}</div>
          <h1>Waiting for presenter</h1>
          <p>Keep this page open. Your screen will update when the room starts.</p>
          <div className="system-line"><span className={`status-dot ${connected ? 'online' : ''}`} /> {connected ? 'Connected' : 'Reconnecting'}</div>
        </section>
      </main>
    );
  }

  if (roomState.game?.bossHealth === 0) {
    return (
      <main className="student-screen wide">
        <ResultsScreen lessonData={lessonData} roomState={roomState} />
        <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
      </main>
    );
  }

  return (
    <main className="student-screen wide">
      <header className="student-header">
        <div>
          <div className="eyebrow">Room {roomState.roomCode}</div>
          <h1>{studentName}</h1>
        </div>
        <div className="student-score">
          <strong>{me?.score || 0}</strong>
          <span>points</span>
        </div>
      </header>

      {roomState.game?.active ? (
        <GameArena
          lessonData={lessonData}
          roomState={roomState}
          activeQuestion={activeQuestion}
          activeResponses={activeResponses}
          onAnswer={answer}
        />
      ) : (
        <div className="student-lesson-stack">
          <LessonViewer lessonData={lessonData} slideIndex={roomState.slideIndex} animation={roomState.animation} compact />
          {activeQuestion ? (
            <QuestionCard
              question={activeQuestion}
              revealAnswers={roomState.revealAnswers}
              responses={activeResponses}
              mode="student"
              onAnswer={answer}
            />
          ) : (
            <section className="student-card">
              <h2>{roomState.lessonStarted ? 'Follow the presenter' : 'Waiting for lesson start'}</h2>
              <p>Questions will appear here when the presenter launches them.</p>
            </section>
          )}
        </div>
      )}
      <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
    </main>
  );
}
