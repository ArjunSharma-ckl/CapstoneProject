import TreatmentCard from './TreatmentCard.jsx';
import QuestionCard from './QuestionCard.jsx';

export default function GameArena({
  lessonData,
  roomState,
  activeQuestion,
  activeResponses,
  presenter = false,
  onControl,
  onAnswer
}) {
  const game = roomState?.game;
  const scenario = lessonData.scenarios.find((item) => item.id === game?.scenarioId) || lessonData.scenarios[0];
  const mutation = lessonData.mutations.find((item) => item.id === game?.mutationId);
  const healthPercent = Math.max(0, Math.round(((game?.bossHealth ?? 0) / (game?.maxHealth || 100)) * 100));

  if (!game?.active) {
    return (
      <section className="game-ready">
        <div>
          <div className="eyebrow">Final cooperative game</div>
          <h2>{lessonData.gameSettings.title}</h2>
          <p>Start the game when the class is ready. Students earn treatment charges by answering biology questions.</p>
        </div>
        {presenter && (
          <button className="button primary large" onClick={() => onControl('game:start', { scenarioId: scenario.id })}>
            Start Final Game
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="game-arena">
      <div className="game-topbar">
        <div className="health-block">
          <div className="health-row">
            <strong>Cancer health</strong>
            <span>{game.bossHealth}/{game.maxHealth}</span>
          </div>
          <div className="health-bar" aria-label="Cancer health">
            <span style={{ width: `${healthPercent}%` }} />
          </div>
        </div>
        <span className="badge">{scenario.badge}</span>
        <span className="badge">Round {game.round}</span>
        <span className="badge combo">Class Combo {game.streak}</span>
        <span className="badge charges">{game.charges} charges</span>
      </div>

      {mutation && (
        <div className="mutation-alert">
          <strong>{mutation.title}</strong>
          <span>{mutation.text}</span>
        </div>
      )}

      <div className="game-layout">
        <div className="battlefield-panel">
          <div className="battlefield-header">
            <div>
              <h3>Patient battlefield</h3>
              <p>{scenario.description}</p>
            </div>
          </div>
          <Battlefield healthPercent={healthPercent} mutation={mutation} />
          <div className="attack-log">
            {game.log.length === 0 ? (
              <span>No attacks yet. Earn charges, then choose a treatment card.</span>
            ) : (
              game.log.map((entry) => (
                <div key={entry.id} className="log-entry">
                  <strong>-{entry.damage}</strong>
                  <span>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="resource-panel">
          <div className="panel-heading">
            <h3>Treatment cards</h3>
            <p>Choose the card that fits the scenario biology.</p>
          </div>
          <div className="treatment-list">
            {lessonData.treatments.map((treatment) => {
              const base = scenario.effectiveness?.[treatment.id] ?? 1;
              const modifier = mutation?.modifiers?.[treatment.id] ?? 1;
              return (
                <TreatmentCard
                  key={treatment.id}
                  treatment={treatment}
                  effectiveness={base * modifier}
                  disabled={!presenter || game.charges <= 0 || game.bossHealth <= 0}
                  onUse={presenter ? (id) => onControl('game:attack', { treatmentId: id }) : null}
                />
              );
            })}
          </div>
        </aside>
      </div>

      <div className="game-question-row">
        <QuestionCard
          question={activeQuestion}
          revealAnswers={roomState.revealAnswers}
          responses={activeResponses}
          mode={presenter ? 'presenter' : 'student'}
          onAnswer={onAnswer}
        />
        {presenter && (
          <div className="game-controls">
            <button className="button secondary" onClick={() => launchGameQuestion(lessonData, roomState, onControl)}>
              Launch Game Question
            </button>
            <button className="button secondary" onClick={() => onControl('question:reveal')}>
              Reveal Answer
            </button>
            <button className="button secondary" onClick={() => onControl('game:nextRound')}>
              Next Round / Mutation Check
            </button>
            <label>
              Scenario
              <select value={scenario.id} onChange={(event) => onControl('game:scenario', { scenarioId: event.target.value })}>
                {lessonData.scenarios.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </section>
  );
}

function launchGameQuestion(lessonData, roomState, onControl) {
  const index = (roomState.game.round + Object.keys(roomState.responses || {}).length) % lessonData.questions.length;
  const question = lessonData.questions[index];
  if (question) onControl('question:launch', { questionId: question.id });
}

function Battlefield({ healthPercent, mutation }) {
  return (
    <div className="battlefield">
      <svg viewBox="0 0 620 360" aria-label="Cancer boss inside patient">
        <rect x="32" y="36" width="556" height="284" rx="42" className="patient-zone" />
        <path className="vessel-path" d="M78 240 C178 158, 284 282, 410 184 S540 156, 572 224" />
        <g className={mutation ? 'boss mutated' : 'boss'} style={{ transformOrigin: '310px 178px', opacity: 0.55 + healthPercent / 220 }}>
          <circle cx="310" cy="178" r="58" />
          <circle cx="272" cy="140" r="24" />
          <circle cx="360" cy="142" r="20" />
          <circle cx="348" cy="222" r="24" />
          <path d="M278 178 C298 154, 326 202, 350 176 M278 194 C300 218, 326 158, 350 176" />
        </g>
        <g className="team-cells">
          <circle cx="128" cy="120" r="16" />
          <circle cx="458" cy="102" r="15" />
          <circle cx="478" cy="260" r="17" />
          <path d="M146 122 L248 160 M446 108 L370 150 M462 250 L365 212" />
        </g>
        {mutation && (
          <g className="mutation-tag">
            <path d="M404 58 h132 l18 18 v42 h-150 z" />
            <text x="422" y="88">{mutation.title}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
