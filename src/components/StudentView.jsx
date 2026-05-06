import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';

export default function StudentView({ roomCode, roomState, lessonData, socket }) {
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId)
    || (roomState?.game?.currentQuestion?.id === roomState?.activeQuestionId ? roomState?.game?.currentQuestion : null);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const studentLessonData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : lessonData;

  function answer(payload) {
    socket?.emit('student:answer', {
      roomCode,
      ...payload
    });
  }

  if (!roomState) {
    return (
      <main className="student-fullscreen student-slide-screen">
        <section className="lesson-viewer no-slides">
          <h2>Waiting for presenter</h2>
        </section>
      </main>
    );
  }

  if (roomState.game?.bossHealth === 0) {
    return (
      <main className="student-fullscreen student-results-screen">
        <ResultsScreen lessonData={lessonData} roomState={roomState} />
      </main>
    );
  }

  if (roomState.game?.active) {
    return (
      <main className="student-fullscreen student-game-screen">
        <GameArena
          lessonData={lessonData}
          roomState={roomState}
          activeQuestion={activeQuestion}
          activeResponses={activeResponses}
          onAnswer={answer}
          socket={socket}
          roomCode={roomCode}
        />
      </main>
    );
  }

  if (activeQuestion) {
    return (
      <main className="student-fullscreen student-question-screen">
        <QuestionCard
          question={activeQuestion}
          revealAnswers={roomState.revealAnswers}
          responses={activeResponses}
          mode="student"
          onAnswer={answer}
        />
      </main>
    );
  }

  return (
    <main className="student-fullscreen student-slide-screen">
      <LessonViewer
        lessonData={studentLessonData}
        slideIndex={roomState.slideIndex}
      />
    </main>
  );
}
