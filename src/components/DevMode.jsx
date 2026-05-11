import { useMemo, useState } from 'react';
import { defaultLessonData } from '../data/defaultLessonData.js';

const PASSWORD = 'CapstonProjectA4';
const tabs = ['SLIDES', 'QUESTIONS', 'REVIEW', 'JSON'];
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
          <div className="eyebrow">Locked editor</div>
          <h2>Content editor</h2>
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
            <h2>Edit Content</h2>
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
              <label>Full editable lesson JSON<textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} /></label>
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
