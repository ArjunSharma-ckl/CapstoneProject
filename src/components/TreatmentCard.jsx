export default function TreatmentCard({ treatment, disabled, effectiveness, onUse }) {
  return (
    <article className="treatment-card">
      <TreatmentIcon type={treatment.icon} />
      <div className="treatment-copy">
        <div className="treatment-title-row">
          <h4>{treatment.name}</h4>
          <span className="damage-badge">{Math.round(treatment.damage * (effectiveness ?? 1))} dmg</span>
        </div>
        <p>{treatment.bestUse}</p>
        <small>{treatment.drawback}</small>
      </div>
      {onUse && (
        <button className="button primary compact-button" onClick={() => onUse(treatment.id)} disabled={disabled}>
          Use
        </button>
      )}
    </article>
  );
}

export function TreatmentIcon({ type }) {
  return (
    <svg className={`treatment-icon ${type}`} viewBox="0 0 64 64" aria-hidden="true">
      {type === 'scalpel' && (
        <>
          <path d="M13 48 L48 13" />
          <path d="M45 10 l9 9 l-13 5 z" />
          <path d="M11 50 l9 3 l-6 -10 z" />
        </>
      )}
      {type === 'chemo' && (
        <>
          <path d="M12 20 C26 10, 38 30, 52 20" />
          <path d="M12 42 C26 32, 38 52, 52 42" />
          <circle cx="20" cy="20" r="4" />
          <circle cx="36" cy="31" r="4" />
          <circle cx="48" cy="42" r="4" />
        </>
      )}
      {type === 'beam' && (
        <>
          <path d="M10 16 L44 30" />
          <path d="M10 32 L44 32" />
          <path d="M10 48 L44 34" />
          <circle cx="50" cy="32" r="8" />
        </>
      )}
      {type === 'immune' && (
        <>
          <circle cx="22" cy="34" r="10" />
          <circle cx="44" cy="24" r="8" />
          <path d="M29 31 L38 27" />
          <path d="M45 36 c-8 10 -22 10 -30 0" />
        </>
      )}
      {type === 'cart' && (
        <>
          <circle cx="24" cy="32" r="11" />
          <path d="M24 21 v22 M13 32 h22" />
          <path d="M40 18 h12 v28 h-12 z" />
          <path d="M43 26 h6 M43 34 h6" />
        </>
      )}
      {type === 'light' && (
        <>
          <path d="M11 16 L36 28 L11 40 z" />
          <path d="M38 20 l14 -8 M40 32 h16 M38 44 l14 8" />
          <circle cx="29" cy="32" r="5" />
        </>
      )}
    </svg>
  );
}
