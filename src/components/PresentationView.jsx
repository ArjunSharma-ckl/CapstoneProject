import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import ResponseGraph from './ResponseGraph.jsx';

export default function PresentationView({ roomCode, roomState, lessonData, socket }) {
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : lessonData;
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];

  function returnToSlides() {
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

  if (activeQuestion) {
    return (
      <main className="projection-view projection-question-screen">
        <div className="projection-header">
          <button className="button ghost" onClick={returnToSlides}>Back to Slides</button>
        </div>
        <QuestionCard
          question={activeQuestion}
          revealAnswers={roomState.revealAnswers}
          responses={activeResponses}
          mode="presenter"
        />
        {roomState.showResults && (
          <ResponseGraph question={activeQuestion} responses={activeResponses} />
        )}
      </main>
    );
  }

  return (
    <main className="projection-view">
      <LessonViewer
        lessonData={projectedData}
        slideIndex={roomState.slideIndex}
      />
    </main>
  );
}
