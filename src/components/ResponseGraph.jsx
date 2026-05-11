export default function ResponseGraph({ question, responses = [] }) {
  if (!question) return null;

  const total = responses.length;
  const correct = responses.filter((response) => response.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const rows = getRows(question, responses);
  const maxCount = Math.max(1, ...rows.map((row) => row.count));

  return (
    <section className="response-graph" aria-label="Class response graph">
      <div className="results-grid compact">
        <div className="metric-card"><strong>{total}</strong><span>answered</span></div>
        <div className="metric-card"><strong>{accuracy}%</strong><span>accuracy</span></div>
      </div>

      <div className="graph-bars">
        {rows.map((row) => (
          <div className={`graph-row ${row.correct ? 'correct' : ''}`} key={row.id}>
            <div className="graph-label">
              <span>{row.label}</span>
              <strong>{row.count}</strong>
            </div>
            <div className="graph-track">
              <span style={{ width: `${Math.max(4, (row.count / maxCount) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getRows(question, responses) {
  if (question.type === 'short') {
    return [
      {
        id: 'correct',
        label: 'Complete responses',
        count: responses.filter((response) => response.correct).length,
        correct: true
      },
      {
        id: 'review',
        label: 'Needs review',
        count: responses.filter((response) => !response.correct).length,
        correct: false
      }
    ];
  }

  return (question.choices || []).map((choice) => ({
    id: choice.id,
    label: `${choice.id.toUpperCase()}. ${choice.text}`,
    count: responses.filter((response) => response.answerId === choice.id).length,
    correct: choice.id === question.correctAnswerId
  }));
}
