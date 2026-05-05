import LessonViewer from './LessonViewer.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';

export default function PresentationView({ roomCode, roomState, lessonData }) {
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : lessonData;

  if (!roomState) {
    return (
      <main className="projection-view waiting">
        <h1>Waiting for presenter</h1>
        <p>Waiting for room {roomCode}</p>
        <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
      </main>
    );
  }

  if (roomState.game?.bossHealth === 0) {
    return (
      <main className="projection-view">
        <ResultsScreen lessonData={lessonData} roomState={roomState} />
        <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
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
        />
        <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
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
        <section className="projection-question">
          <div className="eyebrow">Question</div>
          <h2>{activeQuestion.prompt}</h2>
          {roomState.revealAnswers && <p>{activeQuestion.explanation}</p>}
        </section>
      )}
      <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
    </main>
  );
}
