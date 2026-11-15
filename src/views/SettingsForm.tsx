import { WEEKDAYS_SHORT, longDate } from '../lib/date';
import { weekStarts } from '../lib/plan';
import { TEMPLATES } from '../lib/templates';
import type { Settings, TemplateId } from '../lib/types';

/** Gemeinsames Formular für Ersteinrichtung und Einstellungen. */
export function SettingsForm({ value, onChange, lockStart = false }: { value: Settings; onChange: (s: Settings) => void; lockStart?: boolean }) {
  const set = (patch: Partial<Settings>) => onChange({ ...value, ...patch });
  const toggleDay = (d: number) => {
    const has = value.trainingDays.includes(d);
    let days = has ? value.trainingDays.filter((x) => x !== d) : [...value.trainingDays, d];
    if (days.length > 3) days = days.slice(1);
    set({ trainingDays: days.sort((a, b) => a - b) });
  };
  const validDays = value.trainingDays.length >= 2;
  const weeks = value.raceDate > value.startDate ? weekStarts(value).length : 0;

  return (
    <div className="form">
      <div className="field">
        <span>Ziel</span>
        <div className="choice-list">
          {(Object.keys(TEMPLATES) as TemplateId[]).map((t) => (
            <button type="button" key={t} className={`choice${value.templateId === t ? ' active' : ''}`} onClick={() => set({ templateId: t })}>
              <strong>{TEMPLATES[t].name}</strong>
              <span>{TEMPLATES[t].description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="field">
          <span>Start</span>
          <input type="date" value={value.startDate} disabled={lockStart} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
        </label>
        <label className="field">
          <span>Wettkampf</span>
          <input type="date" value={value.raceDate} min={value.startDate} onChange={(e) => e.target.value && set({ raceDate: e.target.value })} />
        </label>
      </div>
      {weeks > 0 && (
        <p className="small muted">
          {weeks} Trainingswochen bis {longDate(value.raceDate)}. Datum noch unsicher? Du kannst es später ändern, ohne deinen Fortschritt zu verlieren.
        </p>
      )}
      {value.raceDate <= value.startDate && <p className="banner warn">Das Wettkampfdatum muss nach dem Start liegen.</p>}

      <div className="field">
        <span>Trainingstage (2–3)</span>
        <div className="day-pills">
          {WEEKDAYS_SHORT.map((d, i) => (
            <button type="button" key={d} className={`pill${value.trainingDays.includes(i) ? ' active' : ''}`} onClick={() => toggleDay(i)}>{d}</button>
          ))}
        </div>
        <small className="muted">
          {validDays
            ? `Der lange Lauf liegt am ${WEEKDAYS_SHORT[Math.max(...value.trainingDays)]}.${value.trainingDays.length === 2 ? ' Mit 3 Tagen kommst du deutlich besser vorbereitet ins Ziel.' : ''}`
            : 'Bitte mindestens 2 Tage wählen.'}
        </small>
      </div>

      <div className="field">
        <label className="switch">
          <input type="checkbox" checked={value.mobility} onChange={(e) => set({ mobility: e.target.checked })} />
          <span>Optionale Mobility-Session (ca. 15 min) pro Woche</span>
        </label>
        {value.mobility && (
          <div className="day-pills">
            {WEEKDAYS_SHORT.map((d, i) => (
              <button type="button" key={d} disabled={value.trainingDays.includes(i)} className={`pill${value.mobilityDay === i ? ' active' : ''}`} onClick={() => set({ mobilityDay: i })}>{d}</button>
            ))}
          </div>
        )}
      </div>

      <label className="switch">
        <input type="checkbox" checked={value.voice} onChange={(e) => set({ voice: e.target.checked })} />
        <span>Sprachansagen im Timer („Jetzt gehen“)</span>
      </label>
    </div>
  );
}

export function settingsValid(s: Settings) {
  return s.trainingDays.length >= 2 && s.raceDate > s.startDate;
}
