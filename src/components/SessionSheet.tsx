import { useState } from 'react';
import { COOLDOWN, EXERCISE_BY_ID, MOBILITY, WARMUP, routineSeconds, type RoutineItem } from '../data/exercises';
import { WEEKDAYS_SHORT, addDays, longDate, weekday } from '../lib/date';
import { moveSession, weekWarnings } from '../lib/plan';
import { sessionTitle, summary, TYPE_INFO } from '../lib/session';
import type { Session, SessionResult } from '../lib/types';
import { findSession, useStore } from '../store';
import { EditSessionForm } from './EditSessionForm';
import { Sheet } from './ui';

function RoutineList({ title, items, onExercise }: { title: string; items: RoutineItem[]; onExercise: (id: string) => void }) {
  return (
    <details className="routine">
      <summary>
        {title} <span className="muted">· ca. {Math.round(routineSeconds(items) / 60)} min</span>
      </summary>
      <ol>
        {items.map((it, i) => (
          <li key={i}>
            <button className="link" onClick={() => onExercise(it.id)}>
              {it.label ?? EXERCISE_BY_ID[it.id].name}
            </button>
            <span className="muted"> {it.sec} s{it.perSide ? ' pro Seite' : ''}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function SessionSheet({ id, onClose, onStart, onExercise }: {
  id: string | null; onClose: () => void; onStart: (id: string) => void; onExercise: (id: string) => void;
}) {
  const { state, update, today } = useStore();
  const [mode, setMode] = useState<'view' | 'edit' | 'move' | 'done'>('view');
  const [warnings, setWarnings] = useState<string[]>([]);
  const found = state && id ? findSession(state, id) : null;

  const close = () => {
    setMode('view');
    setWarnings([]);
    onClose();
  };
  if (!found || !state) return <Sheet open={false} onClose={close}>{null}</Sheet>;

  const { session: s, wi } = found;
  const week = state.weeks[wi];
  const info = TYPE_INFO[s.type];
  const setStatus = (status: Session['status'], result?: SessionResult) =>
    update((d) => {
      const f = findSession(d, s.id)!;
      f.session.status = status;
      f.session.result = result;
    });

  const move = (day: number) => {
    const moved = moveSession(week, s.id, day);
    update((d) => {
      d.weeks[wi] = moved;
    });
    setWarnings(weekWarnings(moved));
    setMode('view');
  };

  return (
    <Sheet open onClose={close} title={info.name}>
      {mode === 'edit' && (
        <EditSessionForm
          initial={s}
          onCancel={() => setMode('view')}
          onSave={(next) => {
            update((d) => {
              const f = findSession(d, s.id)!;
              d.weeks[f.wi].sessions[f.si] = next;
            });
            setMode('view');
          }}
        />
      )}

      {mode === 'done' && <CompleteForm session={s} onCancel={() => setMode('view')} onSave={(r) => { setStatus('done', r); setMode('view'); }} />}

      {(mode === 'view' || mode === 'move') && (
        <>
          <p className="kicker">{longDate(s.date)}{s.optional ? ' · optional' : ''}</p>
          <h3 className="sheet-title" style={{ ['--type' as string]: info.color }}>{sessionTitle(s)}</h3>
          <p className="muted">{summary(s)}</p>
          <p>{info.hint}</p>
          {s.notes && <p className="note">📝 {s.notes}</p>}

          {warnings.map((w) => (
            <div key={w} className="banner warn">⚠️ {w}</div>
          ))}

          {s.status === 'done' && s.result && (
            <div className="banner ok">
              ✓ Erledigt
              {s.result.minutes ? ` · ${s.result.minutes} min` : ''}
              {s.result.km ? ` · ${s.result.km.toLocaleString('de-DE')} km` : ''}
              {s.result.feeling ? ` · Gefühl ${['', '😫', '😕', '🙂', '😀', '🤩'][s.result.feeling]}` : ''}
              {s.result.note && <div className="muted">{s.result.note}</div>}
            </div>
          )}
          {s.status === 'skipped' && <div className="banner">Ausgelassen</div>}

          {s.warmup && <RoutineList title="Einwärmen" items={WARMUP} onExercise={onExercise} />}
          {s.type === 'mobility' && <RoutineList title="Übungen" items={MOBILITY} onExercise={onExercise} />}
          {s.cooldown && <RoutineList title="Dehnen" items={COOLDOWN} onExercise={onExercise} />}

          {mode === 'move' ? (
            <div className="move-box">
              <p><strong>Auf welchen Tag dieser Woche verschieben?</strong></p>
              <div className="day-pills">
                {WEEKDAYS_SHORT.map((d, i) => {
                  const date = addDays(week.start, i);
                  return (
                    <button key={d} className={`pill${weekday(s.date) === i ? ' active' : ''}`} disabled={date < today && date !== s.date} onClick={() => move(i)}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <button className="btn ghost" onClick={() => setMode('view')}>Abbrechen</button>
            </div>
          ) : (
            <div className="actions">
              {s.status === 'planned' && (
                <>
                  <button className="btn primary big" onClick={() => onStart(s.id)}>▶ Training starten</button>
                  <button className="btn" onClick={() => setMode('done')}>✓ Als erledigt eintragen</button>
                  <div className="row">
                    <button className="btn" onClick={() => setMode('move')}>↔ Verschieben</button>
                    <button className="btn" onClick={() => setMode('edit')}>✎ Bearbeiten</button>
                  </div>
                  <button className="btn ghost" onClick={() => setStatus('skipped')}>Auslassen</button>
                </>
              )}
              {s.status !== 'planned' && (
                <div className="row">
                  {s.status === 'done' && <button className="btn" onClick={() => setMode('done')}>✎ Eintrag ändern</button>}
                  <button className="btn ghost" onClick={() => setStatus('planned')}>Zurücksetzen</button>
                </div>
              )}
              <button
                className="btn ghost danger"
                onClick={() => {
                  if (confirm('Diese Einheit löschen?')) {
                    update((d) => {
                      const f = findSession(d, s.id)!;
                      d.weeks[f.wi].sessions.splice(f.si, 1);
                    });
                    close();
                  }
                }}
              >
                Löschen
              </button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

const FEELINGS = [
  { v: 1, e: '😫', t: 'sehr schwer' },
  { v: 2, e: '😕', t: 'schwer' },
  { v: 3, e: '🙂', t: 'okay' },
  { v: 4, e: '😀', t: 'gut' },
  { v: 5, e: '🤩', t: 'super' },
];

export function CompleteForm({ session, onSave, onCancel, prefill }: {
  session: Session; onSave: (r: SessionResult) => void; onCancel: () => void; prefill?: { minutes?: number };
}) {
  const r = session.result;
  const [minutes, setMinutes] = useState<string>(String(r?.minutes ?? prefill?.minutes ?? ''));
  const [km, setKm] = useState<string>(String(r?.km ?? session.params.km ?? ''));
  const [feeling, setFeeling] = useState<number | undefined>(r?.feeling);
  const [note, setNote] = useState(r?.note ?? '');
  const n = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')) || undefined);
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ minutes: n(minutes), km: n(km), feeling, note: note.trim() || undefined, completedAt: new Date().toISOString() });
      }}
    >
      <h3>Wie lief es?</h3>
      <div className="row">
        <label className="field">
          <span>Dauer (min)</span>
          <input type="number" inputMode="decimal" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
        <label className="field">
          <span>Distanz (km)</span>
          <input type="number" inputMode="decimal" step="0.1" value={km} onChange={(e) => setKm(e.target.value)} />
        </label>
      </div>
      <div className="field">
        <span>Gefühl</span>
        <div className="feelings">
          {FEELINGS.map((f) => (
            <button type="button" key={f.v} className={`feeling${feeling === f.v ? ' active' : ''}`} onClick={() => setFeeling(f.v)} aria-label={f.t}>
              <span>{f.e}</span>
              <small>{f.t}</small>
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Notiz (optional)</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Wade etwas fest, schönes Wetter" />
      </label>
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn primary">Speichern</button>
      </div>
    </form>
  );
}
