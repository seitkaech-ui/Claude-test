import { PHASES } from '../lib/templates';
import { diffDays, longDate } from '../lib/date';
import { currentWeekIndex, detectMissedWeeks } from '../lib/plan';
import { useStore } from '../store';
import { SessionCard } from '../components/ui';
import type { Session } from '../lib/types';

export function Today({ onSession, onStart, onMissed, onWeek }: {
  onSession: (id: string) => void; onStart: (id: string) => void; onMissed: (n: number) => void; onWeek: (i: number) => void;
}) {
  const { state, today, update } = useStore();
  if (!state) return null;
  const { weeks, settings } = state;
  const ci = currentWeekIndex(weeks, today);
  const week = weeks[ci];
  const daysLeft = diffDays(today, settings.raceDate);
  const missed = detectMissedWeeks(weeks, today);
  const showMissed = missed > 0 && state.ackWeek !== week.start;

  const all: Session[] = weeks.flatMap((w) => w.sessions);
  const todays = all.filter((s) => s.date === today);
  const next = all.find((s) => s.date > today && s.status === 'planned' && !s.optional);
  const notStarted = today < weeks[0].start;
  const doneRuns = all.filter((s) => s.status === 'done' && s.type !== 'mobility').length;
  const totalKm = all.reduce((a, s) => a + (s.status === 'done' ? s.result?.km ?? 0 : 0), 0);
  const phase = PHASES[week.phase];

  return (
    <div className="view">
      <header className="hero">
        <p className="kicker">{longDate(today)}</p>
        <h1>{daysLeft > 0 ? <>Noch <span className="accent">{daysLeft}</span> Tage</> : daysLeft === 0 ? 'Heute ist Wettkampftag! 🏁' : 'Geschafft! 🎉'}</h1>
        <p className="muted">
          bis zum {settings.templateId === 'hm' ? 'Halbmarathon' : '10-km-Lauf'} am {longDate(settings.raceDate)}
        </p>
        <div className="progress" aria-label="Fortschritt">
          <div style={{ width: `${Math.min(100, ((ci + (notStarted ? 0 : 1)) / weeks.length) * 100)}%` }} />
        </div>
        <p className="small muted">
          {notStarted ? `Start am ${longDate(weeks[0].start)}` : `Woche ${ci + 1} von ${weeks.length}`} · {doneRuns} {doneRuns === 1 ? "Einheit" : "Einheiten"} erledigt
          {totalKm > 0 && ` · ${totalKm.toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`}
        </p>
      </header>

      {state.warning && <div className="banner warn">⚠️ {state.warning}</div>}

      {showMissed && (
        <div className="banner action">
          <p>
            {missed === 1
              ? 'Letzte Woche hast du weniger als die Hälfte der Läufe geschafft.'
              : `Die letzten ${missed} Wochen hast du kaum trainiert.`}{' '}
            Soll ich den Plan anpassen?
          </p>
          <div className="row">
            <button className="btn primary" onClick={() => onMissed(missed)}>Plan anpassen</button>
            <button className="btn ghost" onClick={() => update((d) => { d.ackWeek = week.start; })}>Passt so</button>
          </div>
        </div>
      )}

      <section>
        <h2>Heute</h2>
        {todays.length ? (
          todays.map((s) => (
            <div key={s.id} className="today-card">
              <SessionCard s={s} onClick={() => onSession(s.id)} />
              {s.status === 'planned' && (
                <button className="btn primary big" onClick={() => onStart(s.id)}>▶ Training starten</button>
              )}
            </div>
          ))
        ) : (
          <div className="empty">
            <p><strong>Ruhetag</strong> – Erholung gehört zum Training. 😌</p>
            <p className="muted small">Lockeres Spazieren, Radfahren oder Dehnen ist ok.</p>
          </div>
        )}
      </section>

      {next && (
        <section>
          <h2>Als Nächstes</h2>
          <SessionCard s={next} showDate onClick={() => onSession(next.id)} />
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>Diese Woche</h2>
          <button className="link" onClick={() => onWeek(ci)}>Woche öffnen →</button>
        </div>
        <div className="stack">
          {week.sessions.map((s) => <SessionCard key={s.id} s={s} showDate today={today} onClick={() => onSession(s.id)} />)}
        </div>
      </section>

      <section className="phase-card">
        <p className="kicker">Phase</p>
        <h3>{phase.name}{week.kind === 'deload' ? ' · Entlastungswoche' : week.repeat ? ' · Festigungswoche' : ''}</h3>
        <p className="muted">{phase.text}</p>
        {week.kind === 'deload' && <p className="small">Diese Woche ist bewusst leichter – dein Körper passt sich in den Pausen an.</p>}
        {week.repeat && <p className="small">Festigungswoche: Du wiederholst die Vorwoche, damit sich dein Körper an die Belastung gewöhnt.</p>}
      </section>

      <button className="btn ghost wide" onClick={() => onMissed(1)}>Ich bin ausgefallen …</button>
    </div>
  );
}
