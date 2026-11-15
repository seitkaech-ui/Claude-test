import type { Session, SessionParams, SessionType } from './types';

export const TYPE_INFO: Record<SessionType, { name: string; short: string; color: string; hint: string }> = {
  walkrun: {
    name: 'Geh-Lauf-Intervalle',
    short: 'Geh-Lauf',
    color: 'var(--c-walkrun)',
    hint: 'Wechsel aus lockerem Laufen und zügigem Gehen. Lauf so langsam, dass du dich unterhalten könntest.',
  },
  easy: {
    name: 'Lockerer Dauerlauf',
    short: 'Locker',
    color: 'var(--c-easy)',
    hint: 'Ruhiges Tempo: Du kannst noch in ganzen Sätzen sprechen. Lieber zu langsam als zu schnell.',
  },
  long: {
    name: 'Langer Lauf',
    short: 'Lang',
    color: 'var(--c-long)',
    hint: 'Die wichtigste Einheit der Woche. Sehr ruhiges Tempo, Gehpausen sind erlaubt. Bei Läufen über 60 min: Wasser mitnehmen.',
  },
  fartlek: {
    name: 'Fahrtspiel',
    short: 'Fahrtspiel',
    color: 'var(--c-tempo)',
    hint: 'Spielerische Tempowechsel: kurze zügige Abschnitte (nur noch kurze Sätze möglich), dazwischen locker traben.',
  },
  tempo: {
    name: 'Tempolauf',
    short: 'Tempo',
    color: 'var(--c-tempo)',
    hint: 'Zügig, aber kontrolliert – „angenehm anstrengend“. Du solltest das Tempo gleichmässig halten können.',
  },
  intervals: {
    name: 'Intervalltraining',
    short: 'Intervalle',
    color: 'var(--c-intervals)',
    hint: 'Kurze, zügige Abschnitte mit Trabpausen. Nicht sprinten – alle Wiederholungen sollen gleich schnell sein.',
  },
  race: {
    name: 'Wettkampf',
    short: 'Wettkampf',
    color: 'var(--c-race)',
    hint: 'Dein grosser Tag! Starte bewusst langsam – die ersten Kilometer fühlen sich immer zu leicht an.',
  },
  mobility: {
    name: 'Mobility & Dehnen',
    short: 'Mobility',
    color: 'var(--c-mobility)',
    hint: 'Lockere Beweglichkeits- und Dehnübungen. Optional, aber gut für Regeneration und Verletzungsvorbeugung.',
  },
  cross: {
    name: 'Alternativtraining',
    short: 'Alternativ',
    color: 'var(--c-cross)',
    hint: 'Radfahren, Schwimmen, Krafttraining oder Wandern – gelenkschonend und gut für die Grundlage.',
  },
};

export const RUN_TYPES: SessionType[] = ['walkrun', 'easy', 'long', 'fartlek', 'tempo', 'intervals', 'race'];
export const HARD_TYPES: SessionType[] = ['long', 'tempo', 'intervals', 'race', 'fartlek'];

export const isRun = (s: Session) => RUN_TYPES.includes(s.type);
export const isHard = (s: Session) => HARD_TYPES.includes(s.type);

/** Annahme für Schätzungen: lockeres Einsteiger-Tempo ~7:30 min/km */
export const EASY_PACE = 7.5;

const num = (n: number | undefined) => (n ?? 0).toLocaleString('de-DE', { maximumFractionDigits: 1 });

export function sessionTitle(s: { type: SessionType; params: SessionParams; title?: string }): string {
  if (s.title) return s.title;
  const p = s.params;
  switch (s.type) {
    case 'walkrun':
      return `${p.reps}× ${num(p.runMin)}′ Laufen / ${num(p.walkMin)}′ Gehen`;
    case 'easy':
      return p.km ? `${num(p.km)} km locker` : `${p.minutes} min locker`;
    case 'long':
      return p.km ? `Langer Lauf ${num(p.km)} km` : `Langer Lauf ${p.minutes} min`;
    case 'fartlek':
      return `Fahrtspiel ${p.reps}× ${num(p.fastMin)}′ zügig`;
    case 'tempo':
      return p.pace === 'Test'
        ? `${num(p.tempoKm)}-km-Testlauf`
        : `Tempolauf ${num(p.tempoKm)} km ${p.pace === 'HM-Tempo' ? 'im HM-Tempo' : 'zügig'}`;
    case 'intervals':
      return `Intervalle ${p.reps}× ${p.meters} m`;
    case 'race':
      return p.km && p.km > 21 ? 'Halbmarathon – Wettkampf' : `Wettkampf ${num(p.km)} km`;
    case 'mobility':
      return 'Mobility & Dehnen';
    case 'cross':
      return `${p.activity || 'Alternativtraining'} ${p.minutes ?? 30} min`;
  }
}

/** Geschätzte Dauer des Hauptteils in Minuten (ohne Einwärmen/Dehnen). */
export function estMinutes(s: { type: SessionType; params: SessionParams }): number {
  const p = s.params;
  switch (s.type) {
    case 'walkrun':
      return (p.reps ?? 0) * ((p.runMin ?? 0) + (p.walkMin ?? 0));
    case 'easy':
    case 'long':
      return p.minutes ?? Math.round((p.km ?? 0) * EASY_PACE);
    case 'fartlek':
      return (p.warmMin ?? 0) + (p.reps ?? 0) * ((p.fastMin ?? 0) + (p.slowMin ?? 0)) + (p.coolMin ?? 0);
    case 'tempo':
      return Math.round(((p.warmKm ?? 0) + (p.coolKm ?? 0)) * EASY_PACE + (p.tempoKm ?? 0) * 6.5);
    case 'intervals':
      return Math.round(
        ((p.warmKm ?? 0) + (p.coolKm ?? 0)) * EASY_PACE +
          (p.reps ?? 0) * (((p.meters ?? 0) / 1000) * 6 + (p.recoverSec ?? 0) / 60),
      );
    case 'race':
      return Math.round((p.km ?? 0) * 7);
    case 'mobility':
      return 15;
    case 'cross':
      return p.minutes ?? 30;
  }
}

/** Geplante Distanz in km, falls distanzbasiert. */
export function plannedKm(s: { type: SessionType; params: SessionParams }): number | undefined {
  const p = s.params;
  switch (s.type) {
    case 'easy':
    case 'long':
    case 'race':
      return p.km;
    case 'tempo':
      return (p.warmKm ?? 0) + (p.tempoKm ?? 0) + (p.coolKm ?? 0);
    case 'intervals':
      return (p.warmKm ?? 0) + (p.coolKm ?? 0) + ((p.reps ?? 0) * (p.meters ?? 0)) / 1000;
    default:
      return undefined;
  }
}

export function summary(s: Session): string {
  const km = plannedKm(s);
  const min = estMinutes(s);
  if (s.type === 'mobility') return `ca. ${min} min`;
  if (km) return `${num(km)} km · ca. ${min} min`;
  return `${min} min`;
}

export function defaultParams(type: SessionType): SessionParams {
  switch (type) {
    case 'walkrun':
      return { reps: 5, runMin: 4, walkMin: 1 };
    case 'easy':
      return { minutes: 30 };
    case 'long':
      return { km: 8 };
    case 'fartlek':
      return { warmMin: 10, reps: 6, fastMin: 1, slowMin: 2, coolMin: 5 };
    case 'tempo':
      return { warmKm: 1.5, tempoKm: 3, coolKm: 1, pace: 'zügig' };
    case 'intervals':
      return { warmKm: 2, reps: 6, meters: 400, recoverSec: 120, coolKm: 1 };
    case 'race':
      return { km: 21.1 };
    case 'mobility':
      return {};
    case 'cross':
      return { minutes: 45, activity: 'Radfahren' };
  }
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
