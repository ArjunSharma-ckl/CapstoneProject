import { useEffect, useState } from 'react';

export default function QuestionCard({ question, revealAnswers, responses = [], mode = 'student', onAnswer }) {
  const [selected, setSelected] = useState('');
  const [shortText, setShortText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const answered = Boolean(selected || submitted);

  useEffect(() => {
    setSelected('');
    setShortText('');
    setSubmitted(false);
    setStartedAt(Date.now());
  }, [question?.id]);

  if (!question) {
    return <div className="question-card empty-state">No active question.</div>;
  }

  function submitAnswer(answerId = selected) {
    if (!onAnswer) return;
    onAnswer({
      questionId: question.id,
      answerId,
      answerText: shortText,
      elapsedMs: Date.now() - startedAt
    });
    setSubmitted(true);
  }

  return (
    <section className={`question-card ${mode}`}>
      <h3>{question.prompt}</h3>

      {question.type === 'short' ? (
        <div className="short-answer">
          <textarea
            value={shortText}
            onChange={(event) => setShortText(event.target.value)}
            placeholder="Type a one-sentence explanation..."
            disabled={mode !== 'student' || answered}
          />
          {mode === 'student' && (
            <button className="button primary" onClick={() => submitAnswer()} disabled={answered || shortText.trim().length < 8}>
              Submit Answer
            </button>
          )}
        </div>
      ) : (
        <div className="choice-grid">
          {question.choices.map((choice) => {
            const isCorrect = revealAnswers && choice.id === question.correctAnswerId;
            const isWrongSelected = revealAnswers && selected === choice.id && choice.id !== question.correctAnswerId;
            return (
              <button
                key={choice.id}
                className={`choice-button ${selected === choice.id ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrongSelected ? 'incorrect' : ''}`}
                onClick={() => {
                  setSelected(choice.id);
                  submitAnswer(choice.id);
                }}
                disabled={mode !== 'student' || Boolean(selected)}
              >
                <span className="choice-letter">{choice.id.toUpperCase()}</span>
                <span>{choice.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {mode === 'presenter' && revealAnswers && (
        <div className="answer-explanation">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}

      {mode === 'presenter' && (
        <div className="response-strip">
          <strong>{responses.length}</strong> responses submitted
        </div>
      )}
    </section>
  );
}
