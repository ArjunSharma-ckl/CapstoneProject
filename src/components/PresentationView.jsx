import LessonViewer from './LessonViewer.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';

export default function PresentationView({ roomCode, roomState, lessonData, socket }) {
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : lessonData;

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
          presenter
          readOnly
        />
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
