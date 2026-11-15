import { COOLDOWN, EXERCISE_BY_ID, MOBILITY, WARMUP, type RoutineItem } from '../data/exercises';
import type { Session } from './types';

export type Cue = 'run' | 'walk' | 'fast' | 'easy' | 'exercise';

export interface Step {
  part: 'warmup' | 'main' | 'cooldown';
  label: string;
  detail?: string;
  /** feste Dauer; ohne Angabe läuft eine Stoppuhr, bis du „Weiter“ tippst */
  seconds?: number;
  cue: Cue;
  exerciseId?: string;
}

const fmtKm = (n: number | undefined) => (n ?? 0).toLocaleString('de-DE', { maximumFractionDigits: 1 });

function routineSteps(items: RoutineItem[], part: Step['part']): Step[] {
  const out: Step[] = [];
  for (const it of items) {
    const ex = EXERCISE_BY_ID[it.id];
    const name = it.label ?? ex.name;
    const sides = it.perSide ? [' – rechts', ' – links'] : [''];
    for (const side of sides) {
      out.push({ part, label: name + side, detail: ex.steps[0], seconds: it.sec, cue: 'exercise', exerciseId: it.id });
    }
  }
  return out;
}

function mainSteps(s: Session): Step[] {
  const p = s.params;
  const m = (label: string, cue: Cue, seconds?: number, detail?: string): Step => ({
    part: 'main', label, cue, seconds, detail, exerciseId: cue === 'exercise' ? undefined : cue === 'walk' ? 'gehen' : 'laufen',
  });
  const manual = 'Tippe „Weiter“, wenn du die Strecke geschafft hast.';
  switch (s.type) {
    case 'walkrun': {
      const out: Step[] = [];
      for (let i = 1; i <= (p.reps ?? 0); i++) {
        out.push(m('Laufen', 'run', (p.runMin ?? 0) * 60, `Intervall ${i} von ${p.reps} – locker, du kannst dich unterhalten`));
        out.push(m('Gehen', 'walk', (p.walkMin ?? 0) * 60, 'Zügig gehen, ruhig atmen'));
      }
      return out;
    }
    case 'easy':
    case 'long': {
      const name = s.type === 'long' ? 'Langer Lauf' : 'Locker laufen';
      return p.km
        ? [m(`${fmtKm(p.km)} km ${s.type === 'long' ? '– langer Lauf' : 'locker'}`, 'easy', undefined, manual)]
        : [m(name, 'easy', (p.minutes ?? 0) * 60, 'Ruhiges Tempo – ganze Sätze sprechen möglich')];
    }
    case 'fartlek': {
      const out = [m('Einlaufen', 'easy', (p.warmMin ?? 0) * 60, 'Locker traben')];
      for (let i = 1; i <= (p.reps ?? 0); i++) {
        out.push(m('Zügig', 'fast', (p.fastMin ?? 0) * 60, `Abschnitt ${i} von ${p.reps} – nur noch kurze Sätze möglich`));
        out.push(m('Locker', 'easy', (p.slowMin ?? 0) * 60, 'Locker traben und erholen'));
      }
      out.push(m('Auslaufen', 'easy', (p.coolMin ?? 0) * 60, 'Ganz locker'));
      return out;
    }
    case 'tempo': {
      const label = p.pace === 'Test' ? 'Testlauf – so schnell, wie du gleichmässig durchhältst' : p.pace === 'HM-Tempo' ? 'im geplanten Halbmarathon-Tempo' : 'zügig, angenehm anstrengend';
      return [
        m(`${fmtKm(p.warmKm)} km einlaufen`, 'easy', undefined, manual),
        m(`${fmtKm(p.tempoKm)} km ${p.pace === 'Test' ? 'Testlauf' : 'Tempo'}`, 'fast', undefined, label),
        m(`${fmtKm(p.coolKm)} km auslaufen`, 'easy', undefined, manual),
      ];
    }
    case 'intervals': {
      const out = [m(`${fmtKm(p.warmKm)} km einlaufen`, 'easy', undefined, manual)];
      for (let i = 1; i <= (p.reps ?? 0); i++) {
        out.push(m(`${p.meters} m zügig`, 'fast', undefined, `Wiederholung ${i} von ${p.reps} – „Weiter“ am Ende tippen`));
        if (i < (p.reps ?? 0)) out.push(m('Trabpause', 'walk', p.recoverSec ?? 120, 'Locker traben oder gehen'));
      }
      out.push(m(`${fmtKm(p.coolKm)} km auslaufen`, 'easy', undefined, manual));
      return out;
    }
    case 'race':
      return [m(`Wettkampf ${fmtKm(p.km)} km`, 'run', undefined, 'Ruhig starten, gleichmässig laufen. Viel Erfolg!')];
    case 'cross':
      return [{ part: 'main', label: p.activity || 'Alternativtraining', cue: 'easy', seconds: (p.minutes ?? 30) * 60 }];
    case 'mobility':
      return routineSteps(MOBILITY, 'main');
  }
}

export function buildSteps(s: Session): Step[] {
  return [
    ...(s.warmup ? routineSteps(WARMUP, 'warmup') : []),
    ...mainSteps(s),
    ...(s.cooldown ? routineSteps(COOLDOWN, 'cooldown') : []),
  ];
}

export const PART_NAMES: Record<Step['part'], string> = {
  warmup: 'Einwärmen',
  main: 'Training',
  cooldown: 'Dehnen',
};
