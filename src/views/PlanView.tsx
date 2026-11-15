import { addDays, shortDate } from '../lib/date';
import { currentWeekIndex } from '../lib/plan';
import { isRun, sessionTitle } from '../lib/session';
import { PHASES, TEMPLATES } from '../lib/templates';
import type { PhaseId } from '../lib/types';
import { useStore } from '../store';

export function PlanView({ onWeek }: { onWeek: (i: number) => void }) {
  const { state, today } = useStore();
  if (!state) return null;
  const { weeks } = state;
  const ci = currentWeekIndex(weeks, today);
  const spare = weeks.filter((w, i) => w.repeat && i >= ci).length;
  const phases = [...new Set(weeks.map((w) => w.phase))] as PhaseId[];

  return (
    <div className="view">
      <header>
        <p className="kicker">{TEMPLATES[state.settings.templateId].name}</p>
        <h1>Dein Plan</h1>
        <p className="muted">
          {weeks.length} Wochen · noch {spare} Pufferwoche{spare === 1 ? '' : 'n'} (Festigungswochen), die Ausfälle auffangen.
        </p>
      </header>
      {state.warning && <div className="banner warn">⚠️ {state.warning}</div>}

      {phases.map((ph) => (
        <section key={ph}>
          <h2>{PHASES[ph].name}</h2>
          <p className="muted small">{PHASES[ph].text}</p>
          <div className="week-list">
            {weeks.map((w, i) => {
              if (w.phase !== ph) return null;
              const runs = w.sessions.filter(isRun);
              const done = runs.filter((s) => s.status === 'done').length;
              const key = runs[runs.length - 1];
              const past = addDays(w.start, 7) <= today;
              return (
                <button key={w.start} className={`week-row${i === ci ? ' current' : ''}${past ? ' past' : ''}`} onClick={() => onWeek(i)}>
                  <span className="week-num">{i + 1}</span>
                  <span className="week-info">
                    <span className="small muted">
                      {shortDate(w.start)}
                      {w.kind === 'deload' && ' · Entlastung'}
                      {w.repeat && ' · Festigung'}
                      {w.kind === 'taper' && ' · Tapering'}
                    </span>
                    <span>{key ? sessionTitle(key) : '—'}</span>
                  </span>
                  <span className="dots" aria-label={`${done} von ${runs.length} erledigt`}>
                    {runs.map((s) => <i key={s.id} className={`dot ${s.status}`} />)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
