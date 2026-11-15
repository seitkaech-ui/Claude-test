import { useState } from 'react';
import { createPlan, defaultSettings } from '../lib/plan';
import { useStore } from '../store';
import { SettingsForm, settingsValid } from './SettingsForm';

export function Setup() {
  const { today, replace } = useStore();
  const [s, setS] = useState(() => defaultSettings(today));
  return (
    <div className="view setup">
      <header className="hero">
        <p className="kicker">Willkommen 👋</p>
        <h1>Dein Weg zum <span className="accent">Halbmarathon</span></h1>
        <p className="muted">
          Ein paar Angaben, dann erstelle ich dir einen Plan – vom Geh-Lauf-Training bis zur Ziellinie. Du kannst danach jede Einheit anpassen.
        </p>
      </header>
      <SettingsForm value={s} onChange={setS} />
      <button className="btn primary big wide" disabled={!settingsValid(s)} onClick={() => replace(createPlan(s, today))}>
        Plan erstellen
      </button>
      <p className="small muted center">Deine Daten bleiben nur auf diesem Gerät gespeichert.</p>
    </div>
  );
}
