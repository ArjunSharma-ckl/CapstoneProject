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
        <div className="eyebrow">Student Device</div>
        <h1>Join the treatment team</h1>
        <p>Your screen will stay synced with the presenter. Use your own answers to earn class treatment charges.</p>
        <label>
          Name or nickname
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya" maxLength={24} />
        </label>
        <label>
          Room code
          <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="BIO123" />
        </label>
        <button className="button primary large" type="submit" disabled={!connected}>
          Join Room
        </button>
        <div className="system-line">
          <span className={`status-dot ${connected ? 'online' : ''}`} />
          {connected ? 'Ready to join' : 'Waiting for realtime server'}
        </div>
      </form>
    </main>
  );
}
