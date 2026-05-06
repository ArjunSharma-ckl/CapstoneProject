import { useState } from 'react';

export default function StudentJoin({ defaultRoomCode, connected, onJoin, onBack }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(defaultRoomCode || 'BIO123');

  function submit(event) {
    event.preventDefault();
    onJoin({ name, code });
  }

  return (
    <main className="join-screen">
      <form className="join-card" onSubmit={submit}>
        <button type="button" className="button ghost back-button" onClick={onBack}>Back</button>
        <label className="control-only">
          <input aria-label="Name or nickname" value={name} onChange={(event) => setName(event.target.value)} placeholder="Name or nickname" maxLength={24} />
        </label>
        <label className="control-only">
          <input aria-label="Room code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="BIO123" />
        </label>
        <button className="button primary large" type="submit" disabled={!connected}>
          Join Room
        </button>
        <div className="system-line">
          <span className={`status-dot ${connected ? 'online' : ''}`} />
          {connected ? 'Ready' : 'Connecting'}
        </div>
      </form>
    </main>
  );
}
