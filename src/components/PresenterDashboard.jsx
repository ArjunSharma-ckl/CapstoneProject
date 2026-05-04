import { useState } from 'react';
import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import DevMode from './DevMode.jsx';

const tabs = ['Slides', 'Questions', 'Students', 'Game', 'Dev/Edit Content'];

export default function PresenterDashboard({
  connected,
  roomCode,
  setRoomCode,
  roomState,
  lessonData,
  onCreateRoom,
  onControl,
  onBack,
  onSaveLessonData,
  onResetLessonData
}) {
  const [activeTab, setActiveTab] = useState('Slides');
  const slides = [...(lessonData.slides || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIndex = roomState?.slideIndex || 0;
  const currentSlide = slides[currentIndex] || slides[0];
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const allResponses = Object.values(roomState?.responses || {}).flat();
  const accuracy = allResponses.length
    ? Math.round((allResponses.filter((response) => response.correct).length / allResponses.length) * 100)
    : 0;
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : lessonData;

  if (!roomState) {
    return (
      <main className="presenter-setup">
        <div className="setup-card">
          <button className="button ghost back-button" onClick={onBack}>Back</button>
          <div className="eyebrow">Presenter Dashboard</div>
          <h1>Create classroom room</h1>
          <p>Students join this code. The projected presentation view can open after the room is created.</p>
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
    <main className="presenter-dashboard simple-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Cancer Treatments Interactive Lesson</h1>
          <p>Room {roomState.roomCode}</p>
        </div>
        <div className="header-actions">
          <span className="room-pill">{connected ? 'Connected' : 'Reconnecting'}</span>
          <button className="button ghost" onClick={onBack}>Exit</button>
        </div>
      </header>

      <nav className="dashboard-tabs" aria-label="Presenter dashboard tabs">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <section className="tab-panel">
        {activeTab === 'Slides' && (
          <SlidesTab
            slides={slides}
            currentSlide={currentSlide}
            currentIndex={currentIndex}
            roomState={roomState}
            lessonData={projectedData}
            onControl={onControl}
          />
        )}

        {activeTab === 'Questions' && (
          <QuestionsTab
            questions={lessonData.questions}
            activeQuestion={activeQuestion}
            activeResponses={activeResponses}
            roomState={roomState}
            onControl={onControl}
          />
        )}

        {activeTab === 'Students' && (
          <StudentsTab
            students={roomState.students}
            activeResponses={activeResponses}
            accuracy={accuracy}
            charges={roomState.game?.charges || 0}
          />
        )}

        {activeTab === 'Game' && (
          <GameTab
            lessonData={lessonData}
            roomState={roomState}
            activeQuestion={activeQuestion}
            activeResponses={activeResponses}
            onControl={onControl}
          />
        )}

        {activeTab === 'Dev/Edit Content' && (
          <DevMode
            lessonData={lessonData}
            onSave={onSaveLessonData}
            onReset={onResetLessonData}
            embedded
            initialUnlocked
          />
        )}
      </section>

      <footer className="app-footer">{lessonData.footerDisclaimer}</footer>
    </main>
  );
}

function SlidesTab({ slides, currentSlide, currentIndex, roomState, lessonData, onControl }) {
  function openPresentationView() {
    const url = `${window.location.origin}${window.location.pathname}?presentation=1&room=${roomState.roomCode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function uploadPdf(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onControl('pdf:set', { pdf: { name: file.name, dataUrl: reader.result } });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="slides-tab">
      <section className="tool-panel">
        <div className="panel-title-row">
          <div>
            <h2>Slides</h2>
            <p>Control what students and the projected screen see.</p>
          </div>
          <button className="button primary" onClick={openPresentationView}>Open Presentation View</button>
        </div>

        <div className="control-grid">
          <label>
            Upload PDF
            <input type="file" accept="application/pdf" onChange={uploadPdf} />
          </label>
          <label>
            Jump to slide
            <select value={currentIndex} onChange={(event) => onControl('slide:set', { index: Number(event.target.value) })}>
              {slides.map((slide, index) => (
                <option key={slide.id} value={index}>{index + 1}. {slide.title}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={roomState.animationOverlay !== false}
              onChange={(event) => onControl('animation:toggle', { enabled: event.target.checked })}
            />
            Show animation overlay
          </label>
        </div>

        <div className="button-row slide-buttons">
          <button className="button secondary" onClick={() => onControl('slide:previous')}>Previous Slide</button>
          <button className="button secondary" onClick={() => onControl('slide:next')}>Next Slide</button>
          <button className="button secondary" onClick={() => onControl('animation:trigger', { type: currentSlide?.animationType })}>
            Trigger Animation
          </button>
          <button className="button primary" onClick={() => onControl('slide:send')}>Send to Student Screens</button>
        </div>
      </section>

      <LessonViewer
        lessonData={lessonData}
        slideIndex={currentIndex}
        animation={roomState.animationOverlay !== false ? roomState.animation : { type: null, nonce: 0 }}
      />
    </div>
  );
}

function QuestionsTab({ questions, activeQuestion, activeResponses, roomState, onControl }) {
  return (
    <div className="questions-tab">
      <section className="tool-panel">
        <div className="panel-title-row">
          <div>
            <h2>Questions</h2>
            <p>Send one question at a time to student screens.</p>
          </div>
          <button className="button secondary" onClick={() => onControl('question:clear')}>Clear Question</button>
        </div>

        <div className="question-list">
          {questions.map((question, index) => (
            <article className={`question-row-card ${activeQuestion?.id === question.id ? 'active' : ''}`} key={question.id}>
              <div>
                <strong>{index + 1}. {question.prompt}</strong>
                <span>{question.concept}</span>
              </div>
              <div className="question-actions">
                <button className="button primary" onClick={() => onControl('question:launch', { questionId: question.id })}>Send Question</button>
                <button className="button secondary" onClick={() => onControl('question:reveal')}>Reveal Answer</button>
                <button className="button secondary" onClick={() => onControl('question:results')}>Show Results</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tool-panel">
        <h2>Current question</h2>
        <QuestionCard
          question={activeQuestion}
          revealAnswers={roomState.revealAnswers}
          responses={activeResponses}
          mode="presenter"
        />
        <ResponseSummary question={activeQuestion} responses={activeResponses} showResults={roomState.showResults} />
      </section>
    </div>
  );
}

function ResponseSummary({ question, responses, showResults }) {
  if (!question) return <p className="muted">No question is active.</p>;
  const total = responses.length;
  const correct = responses.filter((response) => response.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const distribution = question.choices?.map((choice) => ({
    ...choice,
    count: responses.filter((response) => response.answerId === choice.id).length
  })) || [];

  return (
    <div className="response-summary">
      <div className="results-grid compact">
        <div className="metric-card"><strong>{total}</strong><span>answered</span></div>
        <div className="metric-card"><strong>{accuracy}%</strong><span>accuracy</span></div>
      </div>
      {(showResults || responses.length > 0) && distribution.length > 0 && (
        <div className="distribution-list">
          {distribution.map((choice) => (
            <div className="distribution-row" key={choice.id}>
              <span>{choice.id.toUpperCase()}. {choice.text}</span>
              <strong>{choice.count}</strong>
            </div>
          ))}
        </div>
      )}
      {responses.map((response) => (
        <div className="response-row" key={response.studentId}>
          <span>{response.studentName}</span>
          <strong className={response.correct ? 'correct-text' : 'incorrect-text'}>
            {response.correct ? 'Correct' : 'Review'}
          </strong>
        </div>
      ))}
    </div>
  );
}

function StudentsTab({ students, activeResponses, accuracy, charges }) {
  return (
    <section className="tool-panel">
      <div className="panel-title-row">
        <div>
          <h2>Students</h2>
          <p>Connected students and current-question status.</p>
        </div>
        <div className="results-grid compact">
          <div className="metric-card"><strong>{students.length}</strong><span>students</span></div>
          <div className="metric-card"><strong>{accuracy}%</strong><span>accuracy</span></div>
          <div className="metric-card"><strong>{charges}</strong><span>charges</span></div>
        </div>
      </div>
      <div className="student-table">
        {students.length === 0 ? <p className="muted">Waiting for students to join.</p> : students.map((student) => {
          const response = activeResponses.find((item) => item.studentId === student.id);
          return (
            <div className="student-table-row" key={student.id}>
              <span className={`status-dot ${student.connected ? 'online' : ''}`} />
              <strong>{student.name}</strong>
              <span>{student.score} pts</span>
              <span>{response ? 'Answered' : 'Not answered'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GameTab({ lessonData, roomState, activeQuestion, activeResponses, onControl }) {
  if (roomState.game?.bossHealth === 0) {
    return <ResultsScreen lessonData={lessonData} roomState={roomState} />;
  }

  return (
    <div className="game-tab">
      <section className="tool-panel game-start-panel">
        <div>
          <h2>Game</h2>
          <p>Start the final cooperative review game when the lesson is done.</p>
        </div>
        <label>
          Scenario
          <select
            value={roomState.game?.scenarioId || 'localized-solid'}
            onChange={(event) => onControl('game:scenario', { scenarioId: event.target.value })}
          >
            {lessonData.scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        </label>
        <button className="button primary game-time-button" onClick={() => onControl('game:start', { scenarioId: roomState.game?.scenarioId || 'localized-solid' })}>
          GAME TIME!
        </button>
      </section>

      <GameArena
        lessonData={lessonData}
        roomState={roomState}
        activeQuestion={activeQuestion}
        activeResponses={activeResponses}
        presenter
        onControl={onControl}
      />
    </div>
  );
}
