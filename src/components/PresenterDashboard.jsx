import { useState } from 'react';
import JSZip from 'jszip';
import LessonViewer from './LessonViewer.jsx';
import QuestionCard from './QuestionCard.jsx';
import ResponseGraph from './ResponseGraph.jsx';
import DevMode from './DevMode.jsx';

const TABS = ['Slides', 'Questions', 'Students', 'Edit Content'];

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

  const uploadedSlides = roomState?.pdf?.type === 'pptx' ? roomState.pdf.slides : [];
  const currentIndex = roomState?.slideIndex || 0;
  const activeQuestion = lessonData.questions.find((q) => q.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : { ...lessonData, pdf: null };

  if (!roomState) {
    return (
      <main className="presenter-setup">
        <div className="setup-card">
          <button className="button ghost back-button" onClick={onBack}>Back</button>
          <label className="control-only">
            <input
              aria-label="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE HERE"
            />
          </label>
          <button
            className="button primary large"
            onClick={() => onCreateRoom(roomCode)}
            disabled={!connected || !roomCode.trim()}
          >
            Create Room
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="presenter-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-room-label">
          Room: <strong>{roomState.roomCode}</strong>
          {' - '}
          <span className={`conn-dot ${connected ? 'online' : ''}`} />
          {connected ? 'Live' : 'Disconnected'}
        </div>
        <div className="header-actions">
          <button
            className="button secondary"
            onClick={() => onControl('session:reset')}
            disabled={!connected}
            title="Resets slides, questions, and scores (keeps students in the room)."
          >
            Reset Room
          </button>
          <button
            className="button primary"
            onClick={() => openPresentationView(roomState.roomCode)}
          >
            Open Presentation View
          </button>
          <button className="button ghost" onClick={onBack}>Exit</button>
        </div>
      </header>

      <nav className="dashboard-tabs" aria-label="Presenter dashboard tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="tab-panel">
        {activeTab === 'Slides' && (
          <SlidesTab
            uploadedSlides={uploadedSlides}
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
            students={roomState.students || []}
            activeQuestion={activeQuestion}
            activeResponses={activeResponses}
            onControl={onControl}
          />
        )}

        {activeTab === 'Edit Content' && (
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
      onControl('pdf:set', { pdf: { type: 'pptx', name: file.name, slides } });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const pageCount = await countPdfPages(file);
      onControl('pdf:set', { pdf: { type: 'pdf', name: file.name, dataUrl: reader.result, pageCount } });
    };
    reader.readAsDataURL(file);
  }

  const totalSlides = roomState?.pdf?.type === 'pptx'
    ? (uploadedSlides?.length || 0)
    : roomState?.pdf?.pageCount || lessonData?.slides?.length || 0;

  return (
    <div className={`slides-tab ${roomState?.pdf?.type === 'pdf' ? 'pdf-active' : ''}`}>
      <section className="tool-panel">
        <div className="button-row tight">
          <button className="button secondary" onClick={() => onControl('slide:set', { index: 0 })}>
            Reset Slides
          </button>
          <button className="button secondary" onClick={() => onControl('question:clear')}>
            Clear Question
          </button>
        </div>

        <div className="control-grid">
          <label className="button secondary file-button">
            Upload PDF / PPTX
            <input
              type="file"
              accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx"
              onChange={uploadPresentation}
            />
          </label>

          <label className="control-only">
            {roomState?.pdf?.type === 'pptx' && uploadedSlides?.length ? (
              <select
                aria-label="Jump to slide"
                value={currentIndex}
                onChange={(e) => onControl('slide:set', { index: Number(e.target.value) })}
              >
                {uploadedSlides.map((slide, i) => (
                  <option key={slide.id} value={i}>{i + 1}. {slide.title || `Slide ${i + 1}`}</option>
                ))}
              </select>
            ) : (
              <input
                aria-label="Jump to slide"
                type="number"
                min="1"
                max={totalSlides || undefined}
                value={totalSlides ? currentIndex + 1 : ''}
                placeholder={totalSlides ? `1-${totalSlides}` : 'Slide number'}
                onChange={(e) => onControl('slide:set', { index: Math.max(0, Number(e.target.value) - 1) })}
              />
            )}
          </label>
        </div>

        <div className="button-row slide-buttons">
          <button className="button secondary" onClick={() => onControl('slide:previous')}>Previous Slide</button>
          <button className="button secondary" onClick={() => onControl('slide:next')}>Next Slide</button>
        </div>
      </section>

      <LessonViewer lessonData={lessonData} slideIndex={currentIndex} />
    </div>
  );
}

async function countPdfPages(file) {
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('latin1').decode(buffer);
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, matches?.length || 1);
  } catch {
    return 1;
  }
}

async function extractPptxSlides(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) =>
      Number(a.match(/slide(\d+)\.xml/)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml/)?.[1] || 0)
    );
  const parser = new DOMParser();
  const slides = [];
  for (const [index, p] of slidePaths.entries()) {
    const xml = await zip.files[p].async('text');
    const doc = parser.parseFromString(xml, 'application/xml');
    const text = [...doc.getElementsByTagName('a:t')]
      .map((n) => n.textContent?.trim())
      .filter(Boolean);
    const unique = text.filter((line, i) => text.indexOf(line) === i);
    slides.push({ id: `pptx-slide-${index + 1}`, title: unique[0] || `Slide ${index + 1}`, lines: unique.slice(1) });
  }
  return slides.length
    ? slides
    : [{ id: 'pptx-slide-1', title: file.name, lines: ['No readable slide text found.'] }];
}

function QuestionsTab({ questions, activeQuestion, activeResponses, roomState, onControl }) {
  return (
    <div className="questions-tab">
      <section className="tool-panel">
        <div className="panel-title-row">
          <div className="button-row tight">
            <button className="button secondary" onClick={() => onControl('question:clear')}>Clear Question</button>
            <button className="button secondary" onClick={() => onControl('session:reset')}>Reset Room</button>
          </div>
        </div>

        <div className="question-list">
          {questions.map((question, index) => (
            <article
              className={`question-row-card ${activeQuestion?.id === question.id ? 'active' : ''}`}
              key={question.id}
            >
              <div>
                <strong>{index + 1}. {question.prompt}</strong>
                <span className="question-concept">{question.concept}</span>
              </div>
              <div className="question-actions">
                <button className="button primary" onClick={() => onControl('question:launch', { questionId: question.id })}>Send Question</button>
                <button className="button secondary" onClick={() => onControl('question:reveal')} disabled={activeQuestion?.id !== question.id}>Reveal Answer</button>
                <button className="button secondary" onClick={() => onControl('question:results')} disabled={activeQuestion?.id !== question.id}>Show Results</button>
                <button className="button secondary" onClick={() => onControl('question:returnToSlide')} disabled={activeQuestion?.id !== question.id}>Go Back to Slide</button>
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
        <ResponseSummary
          question={activeQuestion}
          responses={activeResponses}
          showResults={roomState.showResults}
        />
        {roomState.showResults && activeQuestion && (
          <ResponseGraph question={activeQuestion} responses={activeResponses} />
        )}
      </section>
    </div>
  );
}

function ResponseSummary({ question, responses, showResults }) {
  if (!question) return <p className="muted">No question is active.</p>;
  const total = responses.length;
  const correct = responses.filter((r) => r.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="response-summary">
      <div className="results-grid compact">
        <div className="metric-card"><strong>{total}</strong><span>answered</span></div>
        <div className="metric-card"><strong>{accuracy}%</strong><span>accuracy</span></div>
      </div>
      {responses.map((r) => (
        <div className="response-row" key={r.studentId}>
          <span>{r.studentName}</span>
          <strong className={r.correct ? 'correct-text' : 'incorrect-text'}>
            {r.correct ? 'Correct' : 'Review'}
          </strong>
        </div>
      ))}
    </div>
  );
}

function StudentsTab({ students, activeQuestion, activeResponses, onControl }) {
  const answeredIds = new Set(activeResponses.map((r) => r.studentId));

  if (!students.length) {
    return (
      <div className="students-tab">
        <section className="tool-panel">
          <p className="muted">No students have joined yet.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="students-tab">
      <section className="tool-panel">
        <div className="button-row tight">
          <button className="button secondary" onClick={() => onControl('session:reset')}>
            Reset Room
          </button>
        </div>
        <table className="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Score</th>
              {activeQuestion && <th>Answered</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className={student.connected ? '' : 'disconnected-row'}>
                <td>{student.name}</td>
                <td>{student.connected ? 'Connected' : 'Disconnected'}</td>
                <td>{student.score ?? 0}</td>
                {activeQuestion && (
                  <td className={answeredIds.has(student.id) ? 'correct-text' : 'muted'}>
                    {answeredIds.has(student.id) ? 'Yes' : 'Waiting'}
                  </td>
                )}
                <td>
                  <button
                    className="button ghost compact-button"
                    onClick={() => onControl('student:remove', { studentId: student.id })}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
