import { useState } from 'react';
import { EditSessionForm } from '../components/EditSessionForm';
import { Icon, SessionCard, Sheet } from '../components/ui';
import { WEEKDAYS_LONG, addDays, shortDate } from '../lib/date';
import { currentWeekIndex, weekWarnings } from '../lib/plan';
import { defaultParams, estMinutes, isRun, plannedKm, uid } from '../lib/session';
import { PHASES } from '../lib/templates';
import type { Session } from '../lib/types';
import { useStore } from '../store';

export function WeekView({ index, setIndex, onSession }: { index: number; setIndex: (i: number) => void; onSession: (id: string) => void }) {
  const { state, update, today } = useStore();
  const [adding, setAdding] = useState<string | null>(null);
  if (!state) return null;
  const weeks = state.weeks;
  const i = Math.min(Math.max(0, index), weeks.length - 1);
  const w = weeks[i];
  const runs = w.sessions.filter(isRun);
  const km = runs.reduce((a, s) => a + (plannedKm(s) ?? 0), 0);
  const min = runs.reduce((a, s) => a + estMinutes(s), 0);
  const warnings = weekWarnings(w);
  const label = w.kind === 'deload' ? 'Entlastungswoche' : w.kind === 'taper' ? 'Tapering' : w.kind === 'race' ? 'Wettkampfwoche' : w.repeat ? 'Festigungswoche' : '';

  const newSession = (date: string): Session => ({
    id: uid(), date, type: 'easy', params: defaultParams('easy'), warmup: true, cooldown: true, status: 'planned',
  });

  return (
    <div className="view">
      <header className="week-head">
        <button className="icon-btn" disabled={i === 0} onClick={() => setIndex(i - 1)} aria-label="Vorherige Woche"><Icon name="left" /></button>
        <div>
          <p className="kicker">Woche {i + 1} von {weeks.length}</p>
          <h1>{shortDate(w.start)} – {shortDate(addDays(w.start, 6))}</h1>
          <p className="muted small">{PHASES[w.phase].name}{label && ` · ${label}`}</p>
        </div>
        <button className="icon-btn" disabled={i === weeks.length - 1} onClick={() => setIndex(i + 1)} aria-label="Nächste Woche"><Icon name="right" /></button>
      </header>

      <p className="week-stats">
        {runs.length} Läufe · ca. {min} min{km > 0 && ` · ca. ${km.toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`}
      </p>
      {warnings.map((m) => <div key={m} className="banner warn">⚠️ {m}</div>)}

      <div className="days">
        {WEEKDAYS_LONG.map((name, d) => {
          const date = addDays(w.start, d);
          const list = w.sessions.filter((s) => s.date === date);
          return (
            <div key={d} className={`day${date === today ? ' is-today' : ''}`}>
              <div className="day-label">
                <strong>{name}</strong>
                <span className="muted small">{shortDate(date)}</span>
                <button className="icon-btn small" onClick={() => setAdding(date)} aria-label={`Einheit am ${name} hinzufügen`}><Icon name="plus" size={18} /></button>
              </div>
              {list.length ? (
                <div className="stack">{list.map((s) => <SessionCard key={s.id} s={s} today={today} onClick={() => onSession(s.id)} />)}</div>
              ) : (
                <p className="rest">Ruhetag</p>
              )}
            </div>
          );
        })}
      </div>

      {i !== currentWeekIndex(weeks, today) && (
        <button className="btn ghost wide" onClick={() => setIndex(currentWeekIndex(weeks, today))}>Zur aktuellen Woche</button>
      )}

      <Sheet open={!!adding} onClose={() => setAdding(null)} title="Neue Einheit">
        {adding && (
          <EditSessionForm
            isNew
            initial={newSession(adding)}
            onCancel={() => setAdding(null)}
            onSave={(s) => {
              update((d) => {
                d.weeks[i].sessions.push(s);
                d.weeks[i].sessions.sort((a, b) => a.date.localeCompare(b.date));
              });
              setAdding(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
