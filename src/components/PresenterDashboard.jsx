import { useState } from 'react';
import JSZip from 'jszip';
import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import GameArena from './GameArena.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import DevMode from './DevMode.jsx';

const tabs = ['SLIDES', 'QUESTIONS', 'GAME', 'EDIT'];

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
  const [activeTab, setActiveTab] = useState('SLIDES');
  const uploadedSlides = roomState?.pdf?.type === 'pptx' ? roomState.pdf.slides : [];
  const currentIndex = roomState?.slideIndex || 0;
  const activeQuestion = lessonData.questions.find((question) => question.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const allResponses = Object.values(roomState?.responses || {}).flat();
  const accuracy = allResponses.length
    ? Math.round((allResponses.filter((response) => response.correct).length / allResponses.length) * 100)
    : 0;
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : { ...lessonData, pdf: null };

  if (!roomState) {
    return (
      <main className="presenter-setup">
        <div className="setup-card">
          <button className="button ghost back-button" onClick={onBack}>Back</button>
          <label className="control-only">
            <input aria-label="Room code" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="BIO123" />
          </label>
          <button className="button primary large" onClick={() => onCreateRoom(roomCode)} disabled={!connected || !roomCode.trim()}>
            Create Room
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="presenter-dashboard simple-dashboard">
      <header className="dashboard-header">
        <div className="header-actions">
          <button className="button primary presentation-top-button" onClick={() => openPresentationView(roomState.roomCode)}>
            Open Presentation View
          </button>
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
        {activeTab === 'SLIDES' && (
          <SlidesTab
            uploadedSlides={uploadedSlides}
            currentIndex={currentIndex}
            roomState={roomState}
            lessonData={projectedData}
            onControl={onControl}
          />
        )}

        {activeTab === 'QUESTIONS' && (
          <QuestionsTab
            questions={lessonData.questions}
            activeQuestion={activeQuestion}
            activeResponses={activeResponses}
            roomState={roomState}
            onControl={onControl}
          />
        )}

        {activeTab === 'GAME' && (
          <GameTab
            lessonData={lessonData}
            roomState={roomState}
            activeQuestion={activeQuestion}
            activeResponses={activeResponses}
            onControl={onControl}
          />
        )}

        {activeTab === 'EDIT' && (
          <DevMode
            lessonData={lessonData}
            onSave={onSaveLessonData}
            onReset={onResetLessonData}
            embedded
            initialUnlocked
          />
        )}
      </section>
    </main>
  );
}

function openPresentationView(roomCode) {
  const url = `${window.location.origin}${window.location.pathname}?presentation=1&room=${roomCode}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function SlidesTab({ uploadedSlides, currentIndex, roomState, lessonData, onControl }) {
  async function uploadPresentation(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pptx')) {
      const slides = await extractPptxSlides(file);
      onControl('pdf:set', {
        pdf: {
          type: 'pptx',
          name: file.name,
          slides
        }
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onControl('pdf:set', { pdf: { type: 'pdf', name: file.name, dataUrl: reader.result } });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="slides-tab">
      <section className="tool-panel">
        <div className="control-grid">
          <label className="button secondary file-button">
            Upload PDF/PPTX
            <input type="file" accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx" onChange={uploadPresentation} />
          </label>
          <label className="control-only">
            {roomState.pdf?.type === 'pptx' && uploadedSlides?.length ? (
              <select aria-label="Jump to slide" value={currentIndex} onChange={(event) => onControl('slide:set', { index: Number(event.target.value) })}>
                {uploadedSlides.map((slide, index) => (
                  <option key={slide.id} value={index}>{index + 1}. {slide.title || `Slide ${index + 1}`}</option>
                ))}
              </select>
            ) : (
              <input
                aria-label="Jump to slide"
                type="number"
                min="1"
                value={roomState.pdf ? currentIndex + 1 : ''}
                placeholder="No slides uploaded"
                onChange={(event) => onControl('slide:set', { index: Math.max(0, Number(event.target.value) - 1) })}
                disabled={!roomState.pdf}
              />
            )}
          </label>
        </div>

        <div className="button-row slide-buttons">
          <button className="button secondary" onClick={() => onControl('slide:previous')}>Previous Slide</button>
          <button className="button secondary" onClick={() => onControl('slide:next')}>Next Slide</button>
          <button className="button primary" onClick={() => onControl('slide:send')}>Send to Student Screens</button>
        </div>
      </section>

      <LessonViewer
        lessonData={lessonData}
        slideIndex={currentIndex}
      />
    </div>
  );
}

async function extractPptxSlides(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => Number(a.match(/slide(\d+)\.xml/)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml/)?.[1] || 0));

  const parser = new DOMParser();
  const slides = [];
  for (const [index, path] of slidePaths.entries()) {
    const xml = await zip.files[path].async('text');
    const doc = parser.parseFromString(xml, 'application/xml');
    const text = [...doc.getElementsByTagName('a:t')]
      .map((node) => node.textContent?.trim())
      .filter(Boolean);
    const uniqueLines = text.filter((line, lineIndex) => text.indexOf(line) === lineIndex);
    slides.push({
      id: `pptx-slide-${index + 1}`,
      title: uniqueLines[0] || `Slide ${index + 1}`,
      lines: uniqueLines.slice(1)
    });
  }

  return slides.length ? slides : [{ id: 'pptx-slide-1', title: file.name, lines: ['No readable slide text found.'] }];
}

function QuestionsTab({ questions, activeQuestion, activeResponses, roomState, onControl }) {
  return (
    <div className="questions-tab">
      <section className="tool-panel">
        <div className="panel-title-row">
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

function GameTab({ lessonData, roomState, activeQuestion, activeResponses, onControl }) {
  if (roomState.game?.status === 'ended') {
    return <ResultsScreen lessonData={lessonData} roomState={roomState} />;
  }

  const players = Object.values(roomState.game?.players || {});
  const classEnergy = players.reduce((sum, player) => sum + (player.energy || 0), 0);
  const classDamage = players.reduce((sum, player) => sum + (player.contribution || 0), 0);

  return (
    <div className="game-tab">
      <section className="tool-panel presenter-game-controls">
        <label className="control-only">
          <select
            aria-label="Scenario"
            value={roomState.game?.scenarioId || 'localized-solid'}
            onChange={(event) => onControl('game:scenario', { scenarioId: event.target.value })}
          >
            {lessonData.scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        </label>
        <button className="button primary game-time-button" onClick={() => onControl('game:start', { scenarioId: roomState.game?.scenarioId || 'localized-solid' })}>Start Game</button>
        <button className="button secondary" onClick={() => onControl('game:pause')}>Pause Game</button>
        <button className="button secondary" onClick={() => onControl('game:reset')}>Reset Game</button>
        <button className="button secondary" onClick={() => onControl('game:spawnCell')}>Spawn Cancer Cell</button>
        <button className="button secondary" onClick={() => onControl('game:mutation')}>Trigger Mutation Event</button>
        <button className="button secondary" onClick={() => onControl('game:energyQuestion')}>Send Energy Question</button>
        <div className="class-game-stats">
          <strong>{classEnergy}</strong><span>Class Energy</span>
          <strong>{classDamage}</strong><span>Damage</span>
        </div>
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
