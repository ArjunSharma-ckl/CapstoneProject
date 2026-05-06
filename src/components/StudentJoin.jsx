import { useState } from 'react';
import { cleanStudentName, hasProfanity } from '../utils/profanity.js';

export default function StudentJoin({ defaultRoomCode, connected, joinError, onClearError, onJoin, onBack }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(defaultRoomCode || '');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const displayName = cleanStudentName(name);
    if (!displayName) {
      setError('Enter a name before joining.');
      onClearError?.();
      return;
    }
    if (hasProfanity(displayName)) {
      setError('Choose a classroom-appropriate name.');
      onClearError?.();
      return;
    }
    setError('');
    onJoin({ name: displayName, code });
  }

  return (
    <main className="join-screen">
      <form className="join-card" onSubmit={submit}>
        <button type="button" className="button ghost back-button" onClick={onBack}>Back</button>
        <label className="control-only">
          <input
            aria-label="Name or nickname"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
              onClearError?.();
            }}
            placeholder="Name or nickname"
            maxLength={24}
          />
        </label>
        <label className="control-only">
          <input aria-label="Room code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ENTER CODE HERE" />
        </label>
        {(error || joinError) && <div className="form-error">{error || joinError}</div>}
        <button className="button primary large" type="submit" disabled={!connected || !code.trim() || !name.trim()}>
          Join Room
        </button>
      </form>
    </main>
  );
}
