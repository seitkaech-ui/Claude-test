import { useState } from 'react';
import { recalculate } from '../lib/plan';
import { sessionTitle } from '../lib/session';
import { useStore } from '../store';
import { Sheet } from './ui';

const OPTIONS = [
  { v: 1, label: '1 Woche', rule: 'Du wiederholst die letzte Woche, die du geschafft hast.' },
  { v: 2, label: '2–3 Wochen', rule: 'Du gehst 2 Stufen zurück und baust wieder sanft auf.' },
  { v: 4, label: '4+ Wochen', rule: 'Nach einer längeren Pause gehst du 4 Stufen zurück.' },
];

export function MissedDialog({ open, onClose, suggested = 1 }: { open: boolean; onClose: () => void; suggested?: number }) {
  const { state, replace, today } = useStore();
  const initial = suggested >= 4 ? 4 : suggested >= 2 ? 2 : 1;
  const [missed, setMissed] = useState(initial);
  if (!state) return null;

  const preview = recalculate(state, missed, today);
  const next = preview.weeks.find((w) => w.sessions.some((s) => s.date >= today && s.status === 'planned'));

  return (
    <Sheet open={open} onClose={onClose} title="Ich bin ausgefallen">
      <p>Kein Problem – das passiert jedem. Wie lange konntest du nicht trainieren?</p>
      <div className="choice-list">
        {OPTIONS.map((o) => (
          <button key={o.v} className={`choice${missed === o.v ? ' active' : ''}`} onClick={() => setMissed(o.v)}>
            <strong>{o.label}</strong>
            <span>{o.rule}</span>
          </button>
        ))}
      </div>
      <p className="muted">
        Verpasste Einheiten werden <strong>nicht nachgeholt</strong> – das wäre zu viel auf einmal. Stattdessen verbrauchst du Pufferwochen.
      </p>
      {next && (
        <div className="banner">
          <strong>So geht es weiter:</strong>
          <ul className="plain">
            {next.sessions.filter((s) => !s.optional).map((s) => <li key={s.id}>{sessionTitle(s)}</li>)}
          </ul>
        </div>
      )}
      {preview.warning && <div className="banner warn">⚠️ {preview.warning}</div>}
      <div className="row">
        <button className="btn ghost" onClick={onClose}>Abbrechen</button>
        <button className="btn primary" onClick={() => { replace(preview); onClose(); }}>Plan anpassen</button>
      </div>
    </Sheet>
  );
}
