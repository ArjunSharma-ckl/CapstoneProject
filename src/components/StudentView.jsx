import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';

export default function StudentView({ roomCode, roomState, lessonData, socket, studentId }) {
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
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

  if (activeQuestion) {
    return (
      <main className="student-fullscreen student-question-screen">
        <QuestionCard
          question={activeQuestion}
          revealAnswers={roomState.revealAnswers}
          responses={activeResponses}
          mode="student"
          studentSeed={studentId}
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
