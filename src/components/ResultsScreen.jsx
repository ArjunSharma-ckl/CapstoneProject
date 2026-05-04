export default function ResultsScreen({ lessonData, roomState }) {
  const responses = Object.values(roomState?.responses || {}).flat();
  const total = responses.length;
  const correct = responses.filter((response) => response.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const missedConcepts = Object.entries(roomState?.conceptStats || {})
    .map(([concept, stat]) => ({ concept, missed: stat.total - stat.correct, total: stat.total }))
    .sort((a, b) => b.missed - a.missed)
    .slice(0, 4);
  const defeated = (roomState?.game?.bossHealth ?? 100) <= 0;

  return (
    <section className="results-screen">
      <div className="results-hero">
        <div>
          <div className="eyebrow">End review</div>
          <h2>{defeated ? 'Cancer defeated' : 'Final health remaining'}</h2>
          <p>{lessonData.review.whyThisMatters}</p>
        </div>
        <div className="result-number">
          <strong>{defeated ? '0' : roomState?.game?.bossHealth ?? 100}</strong>
          <span>cancer health</span>
        </div>
      </div>
      <div className="results-grid">
        <div className="metric-card"><strong>{accuracy}%</strong><span>class accuracy</span></div>
        <div className="metric-card"><strong>{roomState?.students?.length || 0}</strong><span>contributors</span></div>
        <div className="metric-card"><strong>{roomState?.game?.charges || 0}</strong><span>charges remaining</span></div>
      </div>
      <div className="review-columns">
        <div>
          <h3>Top concepts to review</h3>
          {missedConcepts.length ? missedConcepts.map((item) => (
            <div className="concept-row" key={item.concept}>
              <span>{item.concept}</span>
              <strong>{item.missed}/{item.total} missed</strong>
            </div>
          )) : <p>No missed concept data yet.</p>}
        </div>
        <div>
          <h3>Team contribution</h3>
          {[...(roomState?.students || [])].sort((a, b) => b.score - a.score).map((student) => (
            <div className="concept-row" key={student.id}>
              <span>{student.name}</span>
              <strong>{student.score} pts</strong>
            </div>
          ))}
        </div>
        <div className="handout-placeholder">
          <span>{lessonData.review.handoutPlaceholder}</span>
        </div>
      </div>
    </section>
  );
}
