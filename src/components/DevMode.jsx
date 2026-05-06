import { useMemo, useState } from 'react';
import { defaultLessonData } from '../data/defaultLessonData.js';

const PASSWORD = 'CapstonProjectA4';
const tabs = ['SLIDES', 'QUESTIONS', 'TREATMENTS', 'GAME', 'REVIEW', 'JSON'];
const animationPresets = [
  { value: 'cell-division', label: 'Cell division pulse' },
  { value: 'radiation', label: 'Radiation beam' },
  { value: 'chemotherapy', label: 'Chemo particles' },
  { value: 'immunotherapy', label: 'T-cell attack' },
  { value: 'surgery', label: 'Surgery outline/remove' },
  { value: 'pdt', label: 'PDT light activation' }
];

export default function DevMode({ lessonData, onSave, onReset, onClose = () => {}, embedded = false, initialUnlocked = false }) {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(() => structuredClone(lessonData));
  const [activeTab, setActiveTab] = useState('SLIDES');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(lessonData, null, 2));
  const [importText, setImportText] = useState('');
  const sortedSlides = useMemo(() => [...(draft.slides || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [draft.slides]);

  function unlock(event) {
    event.preventDefault();
    if (password === PASSWORD) {
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  }

  function setField(path, value) {
    setDraft((current) => {
      const next = structuredClone(current);
      let target = next;
      path.slice(0, -1).forEach((key) => {
        target = target[key];
      });
      target[path[path.length - 1]] = value;
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function updateArrayItem(arrayName, id, field, value) {
    setDraft((current) => {
      const next = structuredClone(current);
      next[arrayName] = next[arrayName].map((item) => (item.id === id ? { ...item, [field]: value } : item));
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function updateChoice(questionId, choiceId, value) {
    setDraft((current) => {
      const next = structuredClone(current);
      const question = next.questions.find((item) => item.id === questionId);
      question.choices = question.choices.map((choice) => (choice.id === choiceId ? { ...choice, text: value } : choice));
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function updateEffectiveness(scenarioId, treatmentId, value) {
    setDraft((current) => {
      const next = structuredClone(current);
      const scenario = next.scenarios.find((item) => item.id === scenarioId);
      scenario.effectiveness[treatmentId] = Number(value);
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function updateMutationModifier(mutationId, treatmentId, value) {
    setDraft((current) => {
      const next = structuredClone(current);
      const mutation = next.mutations.find((item) => item.id === mutationId);
      mutation.modifiers[treatmentId] = Number(value);
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function moveSlide(id, direction) {
    const ordered = sortedSlides.map((slide) => ({ ...slide }));
    const index = ordered.findIndex((slide) => slide.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= ordered.length) return;
    [ordered[index].order, ordered[swapIndex].order] = [ordered[swapIndex].order, ordered[index].order];
    setDraft((current) => {
      const next = { ...current, slides: ordered };
      setJsonText(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function save() {
    onSave(draft);
  }

  function reset() {
    const next = structuredClone(defaultLessonData);
    setDraft(next);
    setJsonText(JSON.stringify(next, null, 2));
    onReset();
  }

  async function exportJson() {
    const text = JSON.stringify(draft, null, 2);
    await navigator.clipboard?.writeText(text).catch(() => {});
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cancer-treatment-lesson-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJson() {
    try {
      const next = JSON.parse(importText || jsonText);
      setDraft(next);
      setJsonText(JSON.stringify(next, null, 2));
      setImportText('');
      setActiveTab('SLIDES');
    } catch {
      setError('Import JSON could not be parsed.');
    }
  }

  function applyJsonEditor() {
    try {
      const next = JSON.parse(jsonText);
      setDraft(next);
      setError('');
    } catch {
      setError('JSON editor contains invalid JSON.');
    }
  }

  if (!unlocked) {
    return (
      <div className="modal-backdrop">
        <form className="password-modal" onSubmit={unlock}>
          <button type="button" className="modal-close" onClick={onClose}>x</button>
          <div className="eyebrow">Hidden dev mode</div>
          <h2>Admin editor</h2>
          <p>Enter the classroom editing password.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoFocus
          />
          {error && <div className="form-error">{error}</div>}
          <button className="button primary" type="submit">Unlock Editor</button>
        </form>
      </div>
    );
  }

  const editor = (
    <section className={`dev-shell ${embedded ? 'embedded' : ''}`}>
        <header className="dev-header">
          <div>
            <div className="eyebrow">Local content editor</div>
            <h2>EDIT</h2>
          </div>
          <div className="dev-actions">
            <button className="button primary" onClick={save}>Save changes</button>
            <button className="button secondary" onClick={reset}>Reset to default content</button>
            <button className="button secondary" onClick={exportJson}>Export JSON</button>
            {!embedded && <button className="button ghost" onClick={onClose}>Close</button>}
          </div>
        </header>

        {error && <div className="form-error inline">{error}</div>}

        <nav className="tab-row" aria-label="Editor tabs">
          {tabs.map((tab) => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>

        <div className="dev-body">
          {activeTab === 'SLIDES' && (
            <div className="editor-list">
              {sortedSlides.map((slide) => (
                <article className="editor-item" key={slide.id}>
                  <div className="editor-item-header">
                    <strong>{slide.order}. {slide.title}</strong>
                    <div className="button-row tight">
                      <button className="button ghost" onClick={() => moveSlide(slide.id, -1)}>Up</button>
                      <button className="button ghost" onClick={() => moveSlide(slide.id, 1)}>Down</button>
                    </div>
                  </div>
                  <label>Title<input value={slide.title} onChange={(event) => updateArrayItem('slides', slide.id, 'title', event.target.value)} /></label>
                  <label>Description<textarea value={slide.description} onChange={(event) => updateArrayItem('slides', slide.id, 'description', event.target.value)} /></label>
                  <label>Animation preset
                    <select value={slide.animationType} onChange={(event) => updateArrayItem('slides', slide.id, 'animationType', event.target.value)}>
                      {animationPresets.map((preset) => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>Focus label<input value={slide.focus} onChange={(event) => updateArrayItem('slides', slide.id, 'focus', event.target.value)} /></label>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'QUESTIONS' && (
            <div className="editor-list">
              {draft.questions.map((question, index) => (
                <article className="editor-item" key={question.id}>
                  <strong>{index + 1}. {question.prompt}</strong>
                  <label>Prompt<textarea value={question.prompt} onChange={(event) => updateArrayItem('questions', question.id, 'prompt', event.target.value)} /></label>
                  <label>Concept<input value={question.concept} onChange={(event) => updateArrayItem('questions', question.id, 'concept', event.target.value)} /></label>
                  {question.type === 'multiple' && question.choices.map((choice) => (
                    <label key={choice.id}>Choice {choice.id.toUpperCase()}
                      <input value={choice.text} onChange={(event) => updateChoice(question.id, choice.id, event.target.value)} />
                    </label>
                  ))}
                  {question.type === 'multiple' && (
                    <label>Correct answer
                      <select value={question.correctAnswerId} onChange={(event) => updateArrayItem('questions', question.id, 'correctAnswerId', event.target.value)}>
                        {question.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.id.toUpperCase()}</option>)}
                      </select>
                    </label>
                  )}
                  <label>Explanation<textarea value={question.explanation} onChange={(event) => updateArrayItem('questions', question.id, 'explanation', event.target.value)} /></label>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'TREATMENTS' && (
            <div className="editor-list">
              {draft.treatments.map((treatment) => (
                <article className="editor-item" key={treatment.id}>
                  <strong>{treatment.name}</strong>
                  <label>Name<input value={treatment.name} onChange={(event) => updateArrayItem('treatments', treatment.id, 'name', event.target.value)} /></label>
                  <label>Base damage<input type="number" value={treatment.damage} onChange={(event) => updateArrayItem('treatments', treatment.id, 'damage', Number(event.target.value))} /></label>
                  <label>Best use<textarea value={treatment.bestUse} onChange={(event) => updateArrayItem('treatments', treatment.id, 'bestUse', event.target.value)} /></label>
                  <label>Drawback / side effect<textarea value={treatment.drawback} onChange={(event) => updateArrayItem('treatments', treatment.id, 'drawback', event.target.value)} /></label>
                  <label>Why it worked<textarea value={treatment.whyItWorked} onChange={(event) => updateArrayItem('treatments', treatment.id, 'whyItWorked', event.target.value)} /></label>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'GAME' && (
            <div className="editor-list">
              <article className="editor-item">
                <strong>Boss tuning</strong>
                <label>Cancer health<input type="number" value={draft.gameSettings.bossHealth} onChange={(event) => setField(['gameSettings', 'bossHealth'], Number(event.target.value))} /></label>
                <label>Round limit<input type="number" value={draft.gameSettings.roundsLimit} onChange={(event) => setField(['gameSettings', 'roundsLimit'], Number(event.target.value))} /></label>
                <label>Fast answer ms<input type="number" value={draft.gameSettings.fastAnswerMs} onChange={(event) => setField(['gameSettings', 'fastAnswerMs'], Number(event.target.value))} /></label>
              </article>
              {draft.scenarios.map((scenario) => (
                <article className="editor-item" key={scenario.id}>
                  <strong>{scenario.name}</strong>
                  <label>Description<textarea value={scenario.description} onChange={(event) => updateArrayItem('scenarios', scenario.id, 'description', event.target.value)} /></label>
                  <div className="effect-grid">
                    {draft.treatments.map((treatment) => (
                      <label key={treatment.id}>{treatment.name}
                        <input type="number" step="0.05" value={scenario.effectiveness[treatment.id]} onChange={(event) => updateEffectiveness(scenario.id, treatment.id, event.target.value)} />
                      </label>
                    ))}
                  </div>
                </article>
              ))}
              {draft.mutations.map((mutation) => (
                <article className="editor-item" key={mutation.id}>
                  <strong>{mutation.title}</strong>
                  <label>Mutation title<input value={mutation.title} onChange={(event) => updateArrayItem('mutations', mutation.id, 'title', event.target.value)} /></label>
                  <label>Text<textarea value={mutation.text} onChange={(event) => updateArrayItem('mutations', mutation.id, 'text', event.target.value)} /></label>
                  <div className="effect-grid">
                    {draft.treatments.map((treatment) => (
                      <label key={treatment.id}>{treatment.name}
                        <input type="number" step="0.05" value={mutation.modifiers[treatment.id] ?? 1} onChange={(event) => updateMutationModifier(mutation.id, treatment.id, event.target.value)} />
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'REVIEW' && (
            <div className="editor-list">
              <article className="editor-item">
                <label>Why this matters<textarea value={draft.review.whyThisMatters} onChange={(event) => setField(['review', 'whyThisMatters'], event.target.value)} /></label>
                <label>Missed concept intro<textarea value={draft.review.missedConceptIntro} onChange={(event) => setField(['review', 'missedConceptIntro'], event.target.value)} /></label>
                <label>Handout placeholder<input value={draft.review.handoutPlaceholder} onChange={(event) => setField(['review', 'handoutPlaceholder'], event.target.value)} /></label>
              </article>
            </div>
          )}

          {activeTab === 'JSON' && (
            <div className="json-editor">
              <label>Full editable lesson/game JSON<textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} /></label>
              <div className="button-row">
                <button className="button secondary" onClick={applyJsonEditor}>Apply JSON editor</button>
              </div>
              <label>Import JSON<textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste exported JSON here..." /></label>
              <button className="button primary" onClick={importJson}>Import JSON</button>
            </div>
          )}
        </div>
    </section>
  );

  if (embedded) return editor;

  return (
    <div className="modal-backdrop">
      {editor}
    </div>
  );
}
