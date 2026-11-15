import { useState } from 'react';
import { defaultParams, sessionTitle, summary, TYPE_INFO } from '../lib/session';
import type { Session, SessionParams, SessionType } from '../lib/types';
import { NumberField } from './ui';

const TYPES = Object.keys(TYPE_INFO) as SessionType[];

export function EditSessionForm({ initial, onSave, onCancel, isNew = false }: {
  initial: Session; onSave: (s: Session) => void; onCancel: () => void; isNew?: boolean;
}) {
  const [s, setS] = useState<Session>(initial);
  const [mode, setMode] = useState<'km' | 'min'>(initial.params.km ? 'km' : 'min');
  const p = s.params;
  const setP = (patch: Partial<SessionParams>) => setS({ ...s, params: { ...s.params, ...patch } });

  const changeType = (type: SessionType) => {
    const run = type !== 'mobility' && type !== 'cross';
    const params = defaultParams(type);
    setMode(params.km ? 'km' : 'min');
    setS({ ...s, type, params, warmup: run, cooldown: run });
  };

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(s); }}>
      <h3>{isNew ? 'Einheit hinzufügen' : 'Einheit bearbeiten'}</h3>
      <label className="field">
        <span>Art</span>
        <select value={s.type} onChange={(e) => changeType(e.target.value as SessionType)}>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_INFO[t].name}</option>)}
        </select>
      </label>

      {s.type === 'walkrun' && (
        <div className="row">
          <NumberField label="Wiederholungen" value={p.reps} onChange={(v) => setP({ reps: v })} />
          <NumberField label="Laufen" suffix="min" step={0.5} value={p.runMin} onChange={(v) => setP({ runMin: v })} />
          <NumberField label="Gehen" suffix="min" step={0.5} value={p.walkMin} onChange={(v) => setP({ walkMin: v })} />
        </div>
      )}

      {(s.type === 'easy' || s.type === 'long') && (
        <>
          <div className="segmented">
            <button type="button" className={mode === 'min' ? 'active' : ''} onClick={() => { setMode('min'); setP({ km: undefined, minutes: p.minutes ?? 30 }); }}>nach Zeit</button>
            <button type="button" className={mode === 'km' ? 'active' : ''} onClick={() => { setMode('km'); setP({ minutes: undefined, km: p.km ?? 5 }); }}>nach Distanz</button>
          </div>
          {mode === 'min'
            ? <NumberField label="Dauer" suffix="min" value={p.minutes} onChange={(v) => setP({ minutes: v })} />
            : <NumberField label="Distanz" suffix="km" step={0.5} value={p.km} onChange={(v) => setP({ km: v })} />}
        </>
      )}

      {s.type === 'fartlek' && (
        <>
          <div className="row">
            <NumberField label="Einlaufen" suffix="min" value={p.warmMin} onChange={(v) => setP({ warmMin: v })} />
            <NumberField label="Auslaufen" suffix="min" value={p.coolMin} onChange={(v) => setP({ coolMin: v })} />
          </div>
          <div className="row">
            <NumberField label="Wiederholungen" value={p.reps} onChange={(v) => setP({ reps: v })} />
            <NumberField label="Zügig" suffix="min" step={0.5} value={p.fastMin} onChange={(v) => setP({ fastMin: v })} />
            <NumberField label="Locker" suffix="min" step={0.5} value={p.slowMin} onChange={(v) => setP({ slowMin: v })} />
          </div>
        </>
      )}

      {s.type === 'tempo' && (
        <>
          <div className="row">
            <NumberField label="Einlaufen" suffix="km" step={0.5} value={p.warmKm} onChange={(v) => setP({ warmKm: v })} />
            <NumberField label="Tempo" suffix="km" step={0.5} value={p.tempoKm} onChange={(v) => setP({ tempoKm: v })} />
            <NumberField label="Auslaufen" suffix="km" step={0.5} value={p.coolKm} onChange={(v) => setP({ coolKm: v })} />
          </div>
          <label className="field">
            <span>Tempo</span>
            <select value={p.pace} onChange={(e) => setP({ pace: e.target.value as SessionParams['pace'] })}>
              <option value="zügig">zügig</option>
              <option value="HM-Tempo">Halbmarathon-Tempo</option>
              <option value="Test">Testlauf</option>
            </select>
          </label>
        </>
      )}

      {s.type === 'intervals' && (
        <>
          <div className="row">
            <NumberField label="Wiederholungen" value={p.reps} onChange={(v) => setP({ reps: v })} />
            <NumberField label="Strecke" suffix="m" step={100} value={p.meters} onChange={(v) => setP({ meters: v })} />
            <NumberField label="Pause" suffix="s" step={15} value={p.recoverSec} onChange={(v) => setP({ recoverSec: v })} />
          </div>
          <div className="row">
            <NumberField label="Einlaufen" suffix="km" step={0.5} value={p.warmKm} onChange={(v) => setP({ warmKm: v })} />
            <NumberField label="Auslaufen" suffix="km" step={0.5} value={p.coolKm} onChange={(v) => setP({ coolKm: v })} />
          </div>
        </>
      )}

      {s.type === 'race' && <NumberField label="Distanz" suffix="km" step={0.1} value={p.km} onChange={(v) => setP({ km: v })} />}

      {s.type === 'cross' && (
        <div className="row">
          <label className="field">
            <span>Aktivität</span>
            <input value={p.activity ?? ''} onChange={(e) => setP({ activity: e.target.value })} placeholder="Radfahren, Schwimmen, Kraft …" />
          </label>
          <NumberField label="Dauer" suffix="min" value={p.minutes} onChange={(v) => setP({ minutes: v })} />
        </div>
      )}

      {s.type !== 'mobility' && s.type !== 'cross' && (
        <div className="checks">
          <label><input type="checkbox" checked={s.warmup} onChange={(e) => setS({ ...s, warmup: e.target.checked })} /> Einwärmen davor</label>
          <label><input type="checkbox" checked={s.cooldown} onChange={(e) => setS({ ...s, cooldown: e.target.checked })} /> Dehnen danach</label>
        </div>
      )}

      <label className="field">
        <span>Eigener Titel (optional)</span>
        <input value={s.title ?? ''} placeholder={sessionTitle({ ...s, title: undefined })} onChange={(e) => setS({ ...s, title: e.target.value || undefined })} />
      </label>
      <label className="field">
        <span>Notiz (optional)</span>
        <textarea rows={2} value={s.notes ?? ''} onChange={(e) => setS({ ...s, notes: e.target.value || undefined })} />
      </label>

      <p className="muted">Vorschau: {sessionTitle(s)} · {summary(s)}</p>
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>Abbrechen</button>
        <button type="submit" className="btn primary">Speichern</button>
      </div>
    </form>
  );
}
