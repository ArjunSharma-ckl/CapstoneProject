import { useEffect, useState } from 'react';

function getRandomizedChoices(question, studentSeed = '') {
  if (!question?.choices || question.type === 'short') return question?.choices || [];

  let seed = (studentSeed + question.id).split('').reduce((acc, char) => {
    return Math.imul(31, acc) + char.charCodeAt(0) | 0;
  }, 2166136261);
  const choices = [...question.choices];

  function nextRandom() {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }

  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  const unchanged = choices.every((choice, index) => choice.id === question.choices[index]?.id);
  if (unchanged && choices.length > 1) {
    choices.push(choices.shift());
  }

  return choices;
}

export default function QuestionCard({ question, revealAnswers, responses = [], mode = 'student', onAnswer, studentSeed = '' }) {
  const [selected, setSelected] = useState('');
  const [shortText, setShortText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  const studentResponse = mode === 'student'
    ? responses.find((response) => response.studentId === studentSeed)
    : null;
  const selectedAnswerId = selected || studentResponse?.answerId || '';
  const submittedShortText = shortText || studentResponse?.answerText || '';
  const answered = Boolean(selectedAnswerId || submitted || studentResponse);
  const responseCorrect = studentResponse?.correct ?? (selectedAnswerId && selectedAnswerId === question?.correctAnswerId);
  const showStudentFeedback = mode === 'student' && revealAnswers && Boolean(studentResponse || selectedAnswerId);
  const displayedChoices = mode === 'student' ? getRandomizedChoices(question, studentSeed) : question?.choices || [];

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
            value={submittedShortText}
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
          {displayedChoices.map((choice) => {
            const isCorrect = revealAnswers && choice.id === question.correctAnswerId;
            const isWrongSelected = revealAnswers && selectedAnswerId === choice.id && choice.id !== question.correctAnswerId;
            return (
              <button
                key={choice.id}
                className={`choice-button ${selectedAnswerId === choice.id ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrongSelected ? 'incorrect' : ''}`}
                onClick={() => {
                  setSelected(choice.id);
                  submitAnswer(choice.id);
                }}
                disabled={mode !== 'student' || answered}
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

      {showStudentFeedback && (
        <div className={`answer-feedback ${responseCorrect ? 'correct' : 'incorrect'}`}>
          <strong>{responseCorrect ? 'Correct' : 'Incorrect'}</strong>
          <p>{question.explanation}</p>
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
