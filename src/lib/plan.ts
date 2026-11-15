import { addDays, diffDays, mondayOf, weekday } from './date';
import { isHard, isRun, uid } from './session';
import { TEMPLATES, type LevelDef } from './templates';
import type { AppState, Session, Settings, Week } from './types';

export const DEFAULT_RACE_DATE = '2027-09-19';

export function defaultSettings(todayStr: string): Settings {
  return {
    templateId: 'hm',
    startDate: todayStr,
    raceDate: DEFAULT_RACE_DATE,
    trainingDays: [0, 2, 5],
    mobility: true,
    mobilityDay: 6,
    voice: true,
    reminderTime: '18:00',
    reminderMinutes: 60,
  };
}

const sortedDays = (s: Settings) => [...s.trainingDays].sort((a, b) => a - b);

/** Erster Planmontag. Liegt im Startwoche kein Trainingstag mehr, beginnt der Plan am nächsten Montag. */
export function planStartMonday(s: Settings): string {
  const mon = mondayOf(s.startDate);
  const left = sortedDays(s).some((d) => addDays(mon, d) >= s.startDate);
  return left ? mon : addDays(mon, 7);
}

export function weekStarts(s: Settings): string[] {
  const first = planStartMonday(s);
  const last = mondayOf(s.raceDate);
  const n = Math.max(1, Math.floor(diffDays(first, last) / 7) + 1);
  return Array.from({ length: n }, (_, i) => addDays(first, i * 7));
}

export interface SeqItem {
  level: number;
  repeat: boolean;
}

/**
 * Verteilt die Stufen ab `startLevel` auf `weeks` Kalenderwochen.
 * - Überzählige Wochen werden als Festigungswochen (Wiederholung) gleichmässig verteilt.
 * - Fehlende Wochen: die letzten Aufbaustufen vor dem Tapering werden gestrichen.
 */
export function buildSequence(levels: LevelDef[], startLevel: number, weeks: number) {
  const total = levels.length;
  const tailStart = levels.findIndex((l) => l.kind === 'taper' || l.kind === 'race');
  const s = Math.min(Math.max(0, startLevel), total - 1);
  const build: number[] = [];
  for (let i = s; i < tailStart; i++) build.push(i);
  const tail: number[] = [];
  for (let i = Math.max(s, tailStart); i < total; i++) tail.push(i);

  const spare = weeks - build.length - tail.length;
  let seq: SeqItem[];
  let dropped = 0;

  if (spare >= 0) {
    let candidates = build.filter((i) => levels[i].kind === 'build');
    if (candidates.length === 0) candidates = build.length ? [build[0]] : [tail[0]];
    const extra = new Map<number, number>();
    for (let k = 0; k < spare; k++) {
      const c = candidates[Math.floor(((k + 0.5) * candidates.length) / spare)];
      extra.set(c, (extra.get(c) ?? 0) + 1);
    }
    seq = [];
    for (const i of [...build, ...tail]) {
      seq.push({ level: i, repeat: false });
      for (let r = 0; r < (extra.get(i) ?? 0); r++) seq.push({ level: i, repeat: true });
    }
  } else {
    dropped = -spare;
    let b = build;
    let t = tail;
    const fromBuild = Math.min(dropped, b.length);
    b = b.slice(0, b.length - fromBuild);
    const rest = dropped - fromBuild;
    if (rest > 0) t = t.slice(Math.min(rest, t.length - 1));
    seq = [...b, ...t].map((level) => ({ level, repeat: false }));
  }
  return { seq, spare: Math.max(0, spare), dropped };
}

function makeSession(date: string, spec: { type: Session['type']; params: Session['params'] }): Session {
  const run = spec.type !== 'mobility' && spec.type !== 'cross';
  return {
    id: uid(),
    date,
    type: spec.type,
    params: { ...spec.params },
    warmup: run,
    cooldown: run,
    status: 'planned',
  };
}

export function buildWeek(settings: Settings, levels: LevelDef[], item: SeqItem, start: string): Week {
  const def = levels[item.level];
  const days = sortedDays(settings);
  const specs = days.length >= 3 ? def.days : [def.days[0], def.days[2]];
  let sessions: Session[] = days.slice(0, specs.length).map((d, i) => makeSession(addDays(start, d), specs[i]));

  if (def.kind === 'race') {
    const raceSpec = specs[specs.length - 1];
    sessions = sessions.slice(0, -1).filter((s) => s.date < settings.raceDate);
    sessions.push(makeSession(settings.raceDate, raceSpec));
  }

  if (settings.mobility && !days.includes(settings.mobilityDay)) {
    const date = addDays(start, settings.mobilityDay);
    if (def.kind !== 'race' || date < settings.raceDate) {
      sessions.push({ ...makeSession(date, { type: 'mobility', params: {} }), optional: true });
    }
  }

  sessions = sessions.filter((s) => s.date >= settings.startDate).sort((a, b) => a.date.localeCompare(b.date));
  return { start, level: item.level, phase: def.phase, kind: def.kind, repeat: item.repeat, sessions };
}

function warningText(dropped: number, levels: LevelDef[], seq: SeqItem[]): string | undefined {
  if (dropped <= 0) return undefined;
  const maxLong = Math.max(
    ...seq.map((it) => levels[it.level].days[2]).filter((d) => d.type === 'long').map((d) => d.params.km ?? 0),
    0,
  );
  return (
    `Die verbleibende Zeit reicht nicht für den vollständigen Plan: ${dropped} Aufbauwoche(n) wurden gestrichen` +
    (maxLong ? ` (längster Lauf jetzt ${maxLong.toLocaleString('de-DE')} km)` : '') +
    '. Überlege, ob du das Wettkampfdatum verschieben möchtest.'
  );
}

/** Erstellt einen komplett neuen Plan. */
export function createPlan(settings: Settings, nowStr: string): AppState {
  const levels = TEMPLATES[settings.templateId].levels;
  const starts = weekStarts(settings);
  const { seq, dropped } = buildSequence(levels, 0, starts.length);
  return {
    version: 1,
    settings,
    weeks: seq.map((it, i) => buildWeek(settings, levels, it, starts[i])),
    warning: warningText(dropped, levels, seq),
    createdAt: nowStr,
  };
}

export function currentWeekIndex(weeks: Week[], todayStr: string): number {
  if (!weeks.length) return 0;
  if (todayStr < weeks[0].start) return 0;
  const i = weeks.findIndex((w) => todayStr >= w.start && todayStr < addDays(w.start, 7));
  return i === -1 ? weeks.length - 1 : i;
}

/** Eine Woche gilt als geschafft, wenn mindestens die Hälfte der Laufeinheiten erledigt ist. */
export function weekCompleted(w: Week): boolean {
  const runs = w.sessions.filter(isRun);
  if (!runs.length) return true;
  return runs.filter((s) => s.status === 'done').length * 2 >= runs.length;
}

/** Anzahl aufeinanderfolgender, nicht geschaffter Wochen direkt vor der aktuellen Woche. */
export function detectMissedWeeks(weeks: Week[], todayStr: string): number {
  const cur = currentWeekIndex(weeks, todayStr);
  if (todayStr < weeks[0]?.start) return 0;
  let n = 0;
  for (let i = cur - 1; i >= 0; i--) {
    if (weekCompleted(weeks[i])) break;
    n++;
  }
  return n;
}

/** Ab welcher Stufe es nach `missed` Ausfallwochen weitergeht. */
export function fallbackLevel(lastCompleted: number, missed: number): number {
  if (missed <= 0) return lastCompleted + 1;
  if (missed === 1) return lastCompleted; // letzte geschaffte Woche wiederholen
  if (missed <= 3) return lastCompleted - 1; // 2 Stufen zurück
  return lastCompleted - 3; // längere Pause: 4 Stufen zurück
}

/**
 * Berechnet den Plan ab der aktuellen Woche neu.
 * Vergangene Wochen bleiben als Verlauf erhalten.
 */
export function recalculate(state: AppState, missed: number, todayStr: string): AppState {
  const settings = state.settings;
  const levels = TEMPLATES[settings.templateId].levels;
  const starts = weekStarts(settings);
  const old = state.weeks;
  const cur = currentWeekIndex(old, todayStr);
  let from = cur;
  if (old[cur]?.sessions.some((s) => s.status === 'done')) from = cur + 1;

  // Vergangenheit: offene Einheiten als ausgelassen markieren
  const history = old.slice(0, Math.min(from, old.length)).map((w) => ({
    ...w,
    sessions: w.sessions.map((s) =>
      s.status === 'planned' && s.date < todayStr ? { ...s, status: 'skipped' as const } : s,
    ),
  }));

  // Zukunft beginnt bei der Woche starts[from] (Plan-Raster aus den Einstellungen)
  const futureStarts = starts.filter((d) => d >= (old[from]?.start ?? addDays(old[old.length - 1].start, 7)));
  if (!futureStarts.length) return { ...state, weeks: history, ackWeek: old[cur]?.start };

  let last = -1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (weekCompleted(history[i]) && history[i].sessions.some((s) => isRun(s) && s.status === 'done')) {
      last = history[i].level;
      break;
    }
  }
  const startLevel = Math.max(0, Math.min(fallbackLevel(last, last < 0 ? 0 : missed), levels.length - 1));
  const { seq, dropped } = buildSequence(levels, startLevel, futureStarts.length);
  const future = seq.map((it, i) => buildWeek(settings, levels, it, futureStarts[i]));

  return {
    ...state,
    weeks: [...history.filter((w) => w.start < futureStarts[0]), ...future],
    warning: warningText(dropped, levels, seq),
    ackWeek: old[cur]?.start,
  };
}

/**
 * Übernimmt geänderte Einstellungen (z. B. Wettkampfdatum, Trainingstage), ohne den Fortschritt zu verlieren:
 * Ab der aktuellen Woche wird mit der Stufe weitergemacht, die gerade dran ist.
 */
export function applySettings(state: AppState, settings: Settings, todayStr: string): AppState {
  const weeks = state.weeks;
  const cur = currentWeekIndex(weeks, todayStr);
  const startedPlan = weeks.length > 0 && todayStr >= weeks[0].start;
  if (!startedPlan || settings.templateId !== state.settings.templateId || settings.startDate !== state.settings.startDate) {
    return { ...createPlan(settings, state.createdAt), ackWeek: state.ackWeek };
  }
  const levels = TEMPLATES[settings.templateId].levels;
  const from = weeks[cur].sessions.some((s) => s.status === 'done') ? cur + 1 : cur;
  const history = weeks.slice(0, from);
  const nextLevel = weeks[from]?.level ?? (history[history.length - 1]?.level ?? -1) + 1;
  const starts = weekStarts(settings).filter((d) => d >= (weeks[from]?.start ?? addDays(weeks[weeks.length - 1].start, 7)));
  const { seq, dropped } = buildSequence(levels, nextLevel, starts.length);
  return {
    ...state,
    settings,
    weeks: [...history, ...seq.map((it, i) => buildWeek(settings, levels, it, starts[i]))],
    warning: warningText(dropped, levels, seq),
  };
}

/** Prüft nach dem Verschieben, ob harte Einheiten direkt aufeinander folgen. */
export function weekWarnings(w: Week): string[] {
  const out: string[] = [];
  const runs = w.sessions.filter(isRun).sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < runs.length; i++) {
    const a = runs[i - 1];
    const b = runs[i];
    const gap = diffDays(a.date, b.date);
    if (gap === 0) out.push('Zwei Läufe am selben Tag – gönn dir dazwischen lieber einen Ruhetag.');
    else if (gap === 1 && isHard(a) && isHard(b))
      out.push('Zwei anstrengende Einheiten an aufeinanderfolgenden Tagen erhöhen das Verletzungsrisiko.');
  }
  return [...new Set(out)];
}

export function moveSession(w: Week, id: string, day: number): Week {
  return {
    ...w,
    sessions: w.sessions
      .map((s) => (s.id === id ? { ...s, date: addDays(w.start, day) } : s))
      .sort((a, b) => a.date.localeCompare(b.date) || weekday(a.date) - weekday(b.date)),
  };
}
