import { useRef, useState } from 'react';
import { buildIcs } from '../lib/ics';
import { applySettings, createPlan } from '../lib/plan';
import { downloadFile, parseBackup } from '../lib/storage';
import { useStore } from '../store';
import { SettingsForm, settingsValid } from './SettingsForm';

export function SettingsView({ onMissed }: { onMissed: () => void }) {
  const { state, replace, update, today } = useStore();
  const [draft, setDraft] = useState(state!.settings);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!state) return null;
  const s = state.settings;
  const dirty = JSON.stringify(draft) !== JSON.stringify(s);
  const started = today >= state.weeks[0].start;

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="view">
      <header><h1>Einstellungen</h1></header>
      {msg && <div className="banner ok">{msg}</div>}

      <section>
        <h2>Plan</h2>
        <SettingsForm value={draft} onChange={setDraft} lockStart={started} />
        {dirty && (
          <div className="banner">
            <p>Änderungen gelten ab der aktuellen Woche. Erledigte Einheiten bleiben erhalten; manuell geänderte künftige Einheiten werden neu erstellt.</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setDraft(s)}>Verwerfen</button>
              <button className="btn primary" disabled={!settingsValid(draft)} onClick={() => { replace(applySettings(state, draft, today)); flash('Plan aktualisiert.'); }}>
                Übernehmen
              </button>
            </div>
          </div>
        )}
        <button className="btn wide" onClick={onMissed}>Ich bin ausgefallen – Plan neu berechnen</button>
      </section>

      <section>
        <h2>Erinnerungen über den Kalender</h2>
        <p className="muted small">
          Exportiert alle anstehenden Einheiten als Kalenderdatei (.ics). Öffne sie auf dem Handy oder importiere sie im Google Kalender
          (Einstellungen → Importieren). Tipp: Lege dafür einen eigenen Kalender „Lauftraining“ an – dann kannst du ihn nach Planänderungen
          einfach leeren und neu importieren. Google übernimmt beim Import die Standard-Benachrichtigung des Kalenders.
        </p>
        <div className="row">
          <label className="field">
            <span>Trainingszeit</span>
            <input type="time" value={s.reminderTime} onChange={(e) => update((d) => { d.settings.reminderTime = e.target.value || '18:00'; })} />
          </label>
          <label className="field">
            <span>Erinnerung vorher</span>
            <select value={s.reminderMinutes} onChange={(e) => update((d) => { d.settings.reminderMinutes = Number(e.target.value); })}>
              <option value={0}>keine</option>
              <option value={30}>30 min</option>
              <option value={60}>1 Std.</option>
              <option value={120}>2 Std.</option>
              <option value={720}>12 Std.</option>
            </select>
          </label>
        </div>
        <button className="btn primary wide" onClick={() => { downloadFile('lauftraining.ics', buildIcs(state, today), 'text/calendar'); flash('Kalenderdatei heruntergeladen.'); }}>
          📅 Kalenderdatei exportieren
        </button>
      </section>

      <section>
        <h2>Datensicherung</h2>
        <p className="muted small">Deine Daten liegen nur in diesem Browser. Sichere sie ab und zu – z. B. bevor du den Browser-Speicher löschst oder das Handy wechselst.</p>
        <div className="row">
          <button className="btn" onClick={() => downloadFile(`laufplan-backup-${today}.json`, JSON.stringify(state, null, 2), 'application/json')}>Sichern</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Wiederherstellen</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const next = parseBackup(await f.text());
              if (confirm('Aktuellen Plan durch die Sicherung ersetzen?')) {
                replace(next);
                setDraft(next.settings);
                flash('Sicherung wiederhergestellt.');
              }
            } catch (err) {
              alert((err as Error).message);
            }
          }}
        />
      </section>

      <section>
        <h2>Neu anfangen</h2>
        <div className="stack">
          <button className="btn ghost danger wide" onClick={() => {
            if (confirm('Plan komplett neu erstellen? Dein bisheriger Fortschritt geht verloren.')) {
              const fresh = { ...draft, startDate: today };
              replace(createPlan(fresh, today));
              setDraft(fresh);
              flash('Neuer Plan erstellt.');
            }
          }}>Plan komplett neu erstellen (ab heute)</button>
          <button className="btn ghost danger wide" onClick={() => { if (confirm('Alle Daten auf diesem Gerät löschen?')) replace(null); }}>
            Alle Daten löschen
          </button>
        </div>
      </section>

      <p className="small muted center">Laufplan · Version 1.0 · Hinweis: Bei Schmerzen pausieren und ärztlich abklären lassen.</p>
    </div>
  );
}
