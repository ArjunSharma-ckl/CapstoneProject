import { useState } from 'react';

const PASSWORD = 'CapstonProjectA4';

export default function PasswordGate({ title = 'Presenter Login', onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (password === PASSWORD) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect password.');
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <button type="button" className="button ghost back-button" onClick={onCancel}>Back</button>
        <h1>{title}</h1>
        <label className="control-only">
          <input
            id="password-input"
            name="password"
            aria-label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoFocus
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="button primary large" type="submit">Open Dashboard</button>
      </form>
    </main>
  );
}
