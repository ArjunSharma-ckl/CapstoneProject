import { useEffect, useRef, useState } from 'react';
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
  const prevQuestionIdRef = useRef(null);

  const currentIndex = roomState?.slideIndex || 0;
  const activeQuestion = lessonData.questions.find((q) => q.id === roomState?.activeQuestionId);
  const activeResponses = roomState?.responses?.[roomState?.activeQuestionId] || [];
  const projectedData = roomState?.pdf ? { ...lessonData, pdf: roomState.pdf } : { ...lessonData, pdf: null };

  useEffect(() => {
    if (!roomState) {
      prevQuestionIdRef.current = null;
      return;
    }
    const id = roomState.activeQuestionId ?? null;
    const prev = prevQuestionIdRef.current;
    if (id && id !== prev) setActiveTab('Questions');
    if (!id && prev) setActiveTab('Slides');
    prevQuestionIdRef.current = id;
  }, [roomState]);

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
            roomCode={roomState.roomCode}
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

function SlidesTab({ roomCode, currentIndex, roomState, lessonData, onControl }) {
  const [uploadError, setUploadError] = useState('');

  async function uploadPresentation(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Upload a PDF file.');
      event.target.value = '';
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/pdf`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
          'x-file-name': encodeURIComponent(file.name)
        },
        body: file
      });

      if (!response.ok) throw new Error('Upload failed.');
    } catch (error) {
      console.error(error);
      setUploadError('PDF upload failed.');
    } finally {
      event.target.value = '';
    }
  }

  const totalSlides = roomState?.pdf?.pageCount || lessonData?.slides?.length || 0;

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
            Upload PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={uploadPresentation}
            />
          </label>

          <label className="control-only">
            <input
              aria-label="Jump to slide"
              type="number"
              min="1"
              max={totalSlides || undefined}
              value={totalSlides ? currentIndex + 1 : ''}
              placeholder={totalSlides ? `1-${totalSlides}` : 'Slide number'}
              onChange={(e) => onControl('slide:set', { index: Math.max(0, Number(e.target.value) - 1) })}
            />
          </label>
        </div>
        {uploadError && <div className="form-error">{uploadError}</div>}

        <div className="button-row slide-buttons">
          <button className="button secondary" onClick={() => onControl('slide:previous')}>Previous Slide</button>
          <button className="button secondary" onClick={() => onControl('slide:next')}>Next Slide</button>
        </div>
      </section>

      <LessonViewer lessonData={lessonData} slideIndex={currentIndex} />
    </div>
  );
}

function QuestionsTab({ questions, activeQuestion, activeResponses, roomState, onControl }) {
  let questionNumber = 0;
  let lastGroup = '';

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
          {questions.flatMap((question) => {
            const rows = [];
            const group = question.group || question.concept || 'Questions';
            if (group !== lastGroup) {
              rows.push(<div className="question-group-header" key={`${group}-header`}>{group}</div>);
              lastGroup = group;
            }

            questionNumber += 1;
            rows.push(
              <article
                className={`question-row-card ${activeQuestion?.id === question.id ? 'active' : ''}`}
                key={question.id}
              >
                <div>
                  <strong>{questionNumber}. {question.prompt}</strong>
                  <span className="question-concept">{question.concept}</span>
                </div>
                <div className="question-actions">
                  <button className="button primary" onClick={() => onControl('question:launch', { questionId: question.id })}>Send Question</button>
                  <button className="button secondary" onClick={() => onControl('question:reveal')} disabled={activeQuestion?.id !== question.id}>Reveal Answer</button>
                  <button className="button secondary" onClick={() => onControl('question:results')} disabled={activeQuestion?.id !== question.id}>Show Results</button>
                  <button className="button secondary" onClick={() => onControl('question:returnToSlide')} disabled={activeQuestion?.id !== question.id}>Go Back to Slide</button>
                </div>
              </article>
            );
            return rows;
          })}
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
        />
        {roomState.showResults && activeQuestion && (
          <ResponseGraph question={activeQuestion} responses={activeResponses} />
        )}
      </section>
    </div>
  );
}

function ResponseSummary({ question, responses }) {
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
