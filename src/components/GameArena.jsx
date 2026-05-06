import { useEffect } from 'react';
import QuestionCard from './QuestionCard.jsx';

const zones = {
  surgery: { x: 22, y: 28, radius: 16, label: 'Surgery Zone' },
  chemotherapy: { x: 22, y: 72, radius: 16, label: 'Chemo Flow Zone' },
  radiation: { x: 78, y: 28, radius: 16, label: 'Radiation Zone' },
  immunotherapy: { x: 78, y: 72, radius: 16, label: 'Immune Zone' },
  cart: { x: 50, y: 16, radius: 14, label: 'CAR T Marker Zone' },
  pdt: { x: 50, y: 84, radius: 14, label: 'PDT Light Zone' }
};

const attacks = [
  { id: 'surgery', name: 'Surgery Strike', cost: 100, zone: 'surgery' },
  { id: 'chemotherapy', name: 'Chemotherapy Burst', cost: 75, zone: 'chemotherapy' },
  { id: 'radiation', name: 'Radiation Beam', cost: 90, zone: 'radiation' },
  { id: 'immunotherapy', name: 'Immune Boost', cost: 80, zone: 'immunotherapy' },
  { id: 'cart', name: 'CAR T Lock-On', cost: 120, zone: 'cart' },
  { id: 'pdt', name: 'PDT Flash', cost: 70, zone: 'pdt' }
];

export default function GameArena({
  lessonData,
  roomState,
  activeQuestion,
  activeResponses,
  presenter = false,
  onControl,
  onAnswer,
  socket,
  roomCode,
  readOnly = false
}) {
  const game = roomState?.game;
  const players = Object.values(game?.players || {});
  const currentPlayer = socket?.id ? game?.players?.[socket.id] : null;
  const healthPercent = Math.max(0, Math.round(((game?.totalHealth ?? 0) / (game?.maxHealth || 1000)) * 100));
  const minimalHud = Boolean(readOnly);

  useEffect(() => {
    if (presenter || !socket || !currentPlayer || game?.status !== 'running') return undefined;
    const onKeyDown = (event) => {
      const step = event.shiftKey ? 6 : 3;
      const moves = {
        ArrowUp: [0, -step],
        w: [0, -step],
        W: [0, -step],
        ArrowDown: [0, step],
        s: [0, step],
        S: [0, step],
        ArrowLeft: [-step, 0],
        a: [-step, 0],
        A: [-step, 0],
        ArrowRight: [step, 0],
        d: [step, 0],
        D: [step, 0]
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      movePlayer(move[0], move[1]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [presenter, socket, currentPlayer?.x, currentPlayer?.y, game?.status]);

  function movePlayer(dx, dy) {
    if (!socket || !currentPlayer) return;
    socket.emit('game:move', {
      roomCode,
      x: clamp(currentPlayer.x + dx, 3, 97),
      y: clamp(currentPlayer.y + dy, 5, 95)
    });
  }

  function attack(attackId) {
    if (!socket || !currentPlayer) return;
    const selectedAttack = attacks.find((item) => item.id === attackId);
    if (selectedAttack && currentPlayer.energy < selectedAttack.cost) {
      requestQuestion();
      return;
    }
    const liveCells = (game?.cells || []).filter((cell) => cell.health > 0);
    const closest = liveCells.sort((a, b) => distance(currentPlayer, a) - distance(currentPlayer, b))[0];
    socket.emit('game:attack', { roomCode, attackId, cellId: closest?.id });
  }

  function requestQuestion() {
    socket?.emit('game:requestQuestion', { roomCode });
  }

  function heal() {
    if (!socket || !currentPlayer) return;
    const maxHealth = currentPlayer.maxHealth || 100;
    if ((currentPlayer.health ?? maxHealth) >= maxHealth) return;
    if ((currentPlayer.energy || 0) < 25) {
      requestQuestion();
      return;
    }
    socket.emit('game:heal', { roomCode });
  }

  if (!game || game.status === 'lobby') {
    return (
      <section className="cell-battle lobby-screen">
        <div className="lobby-header">
          <strong>Treatment Team: Cell Battle</strong>
          <span>Room {roomState?.roomCode}</span>
        </div>
        <div className="lobby-list">
          {roomState?.students?.length ? roomState.students.map((student, index) => (
            <div className="lobby-player" key={student.id}>
              <span className="capsule-dot" style={{ background: playerColor(index) }} />
              <span>{student.name}</span>
            </div>
          )) : <span>No players joined yet.</span>}
        </div>
        {presenter && onControl && !readOnly ? (
          <button className="button primary cell-battle-start" onClick={() => onControl('game:start', { scenarioId: game?.scenarioId || 'localized-solid' })}>
            Start Game
          </button>
        ) : (
          <div className="lobby-waiting">Waiting for presenter to start...</div>
        )}
      </section>
    );
  }

  if (game.status === 'ended') {
    return (
      <section className="cell-battle ended-screen">
        <h2>Cancer defeated!</h2>
        <ContributionTable players={players} />
      </section>
    );
  }

  return (
    <section className="cell-battle">
      <header className={`cell-battle-topbar ${minimalHud ? 'topbar-light' : ''}`}>
        <div className="cell-health">
          <div className="health-row">
            <strong>Cancer Cell Health: {game.totalHealth} HP</strong>
            <span>{game.status === 'paused' ? 'Paused' : `Round ${game.round || 1}`}</span>
          </div>
          {!minimalHud && <div className="health-bar"><span style={{ width: `${healthPercent}%` }} /></div>}
        </div>
        {!minimalHud && game.currentMutation && <div className="mutation-chip">{game.currentMutation.title}</div>}
        {!presenter && (
          <>
            <div className="energy-chip">Energy {currentPlayer?.energy || 0}</div>
            <div className={`health-chip ${(currentPlayer?.health ?? 100) <= 25 ? 'low' : ''}`}>
              HP {currentPlayer?.health ?? 100}
            </div>
          </>
        )}
      </header>

      <div className="cell-battle-layout">
        <GameMap game={game} players={players} />

        <aside className="cell-battle-side">
          {activeQuestion && !presenter && (
            <div className="game-question-panel">
              <QuestionCard
                question={activeQuestion}
                revealAnswers={roomState.revealAnswers}
                responses={activeResponses}
                mode="student"
                onAnswer={onAnswer}
              />
            </div>
          )}

          {!presenter && !readOnly && (
            <>
              <button className="button primary get-question-button" onClick={requestQuestion}>Get Question</button>
              <button
                className="button secondary heal-button"
                onClick={heal}
                disabled={!currentPlayer || (currentPlayer.health ?? currentPlayer.maxHealth ?? 100) >= (currentPlayer.maxHealth || 100)}
              >
                Heal
              </button>
              <AttackPanel player={currentPlayer} onAttack={attack} />
              <MovePad onMove={movePlayer} disabled={game.status !== 'running'} />
            </>
          )}

          {presenter && (
            <div className="class-energy-panel">
              <ContributionTable players={players} />
            </div>
          )}

          {!minimalHud && <AttackLog log={game.log} />}
        </aside>
      </div>
    </section>
  );
}

function GameMap({ game, players }) {
  const radiationActive = game.cells.some((cell) => cell.health > 0);
  return (
    <div className="cell-map" aria-label="Treatment Team map">
      <div className="map-grid" />
      {radiationActive && <div className="map-radiation-layer" aria-hidden="true" />}
      {Object.entries(zones).map(([id, zone]) => (
        <div
          key={id}
          className={`treatment-zone zone-${id}`}
          style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.radius * 2}%`, height: `${zone.radius * 2}%` }}
        >
          <span>{zone.label}</span>
        </div>
      ))}
      {game.cells.map((cell) => <CancerCell key={cell.id} cell={cell} />)}
      {players.map((player) => <PlayerCapsule key={player.id} player={player} />)}
    </div>
  );
}

function PlayerCapsule({ player }) {
  const health = player.health ?? player.maxHealth ?? 100;
  const maxHealth = player.maxHealth || 100;
  const healthPercent = Math.max(0, Math.min(100, Math.round((health / maxHealth) * 100)));
  const hpColor = healthPercent <= 25 ? '#d94b4b' : healthPercent <= 50 ? '#d88a22' : '#2f9e67';
  const initial = player.name?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <div
      className={`player-capsule ${health <= 0 ? 'downed' : ''}`}
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
        '--player-color': player.color,
        '--hp-angle': `${healthPercent * 3.6}deg`,
        '--hp-color': hpColor
      }}
    >
      <span className="player-core">
        <span className="player-initial">{initial}</span>
      </span>
      <span className="player-stat-stack">
        <strong>{player.energy}E</strong>
        <em>{health}HP</em>
      </span>
      <span className="player-name">{player.name}</span>
    </div>
  );
}

function CancerCell({ cell }) {
  const percent = Math.max(0, Math.round((cell.health / cell.maxHealth) * 100));
  return (
    <div className={`map-cancer-cell ${cell.health <= 0 ? 'defeated' : ''}`} style={{ left: `${cell.x}%`, top: `${cell.y}%` }}>
      <span className="radiation-field" aria-hidden="true" />
      <div className="cancer-core">{cell.health}</div>
      <div className="cell-mini-bar"><b style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function AttackPanel({ player, onAttack }) {
  return (
    <div className="attack-panel">
      {attacks.map((attack) => {
        const needsHeal = player && (player.health ?? player.maxHealth ?? 100) <= 0;
        const canUse = player && !needsHeal && player.energy >= attack.cost;
        return (
          <button
            key={attack.id}
            className={`attack-button ${canUse ? 'available' : 'needs-energy'}`}
            disabled={!player || needsHeal}
            onClick={() => onAttack(attack.id)}
          >
            <span>{attack.name}</span>
            <strong>{needsHeal ? 'Heal first' : canUse ? `${attack.cost} Energy` : 'Get question'}</strong>
          </button>
        );
      })}
    </div>
  );
}

function MovePad({ onMove, disabled }) {
  return (
    <div className="move-pad">
      <button disabled={disabled} onClick={() => onMove(0, -4)}>Up</button>
      <button disabled={disabled} onClick={() => onMove(-4, 0)}>Left</button>
      <button disabled={disabled} onClick={() => onMove(4, 0)}>Right</button>
      <button disabled={disabled} onClick={() => onMove(0, 4)}>Down</button>
    </div>
  );
}

function ContributionTable({ players }) {
  const totalEnergy = players.reduce((sum, player) => sum + (player.energy || 0), 0);
  const totalDamage = players.reduce((sum, player) => sum + (player.contribution || 0), 0);
  return (
    <div className="contribution-table">
      <div><strong>{totalEnergy}</strong><span>Class Energy</span></div>
      <div><strong>{totalDamage}</strong><span>Damage</span></div>
      {players.map((player) => (
        <div className="contribution-row" key={player.id}>
          <span>{player.name}</span>
          <b>{player.energy} E</b>
          <b>{player.health ?? player.maxHealth ?? 100} HP</b>
          <b>{player.contribution || 0} dmg</b>
        </div>
      ))}
    </div>
  );
}

function AttackLog({ log = [] }) {
  return (
    <div className="cell-battle-log">
      {log.length ? log.slice(0, 4).map((entry) => (
        <div key={entry.id}>{entry.message}</div>
      )) : <div>No treatment attacks yet.</div>}
    </div>
  );
}

function playerColor(index) {
  const colors = ['#0d5f57', '#246f8f', '#b45f06', '#7b4f9d', '#28724f', '#9b3f3f'];
  return colors[index % colors.length];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function distance(a, b) {
  return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
}
