import type { PhaseId, SessionParams, SessionType, TemplateId, WeekKind } from './types';

export interface SessionSpec {
  type: SessionType;
  params: SessionParams;
}

export interface LevelDef {
  phase: PhaseId;
  kind: WeekKind;
  /** [Tag 1 (locker), Tag 2 (variabel/Qualität), Tag 3 (langer Lauf)] */
  days: [SessionSpec, SessionSpec, SessionSpec];
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  raceKm: number;
  levels: LevelDef[];
}

// --- Bausteine -------------------------------------------------------------
const wr = (reps: number, runMin: number, walkMin: number): SessionSpec => ({
  type: 'walkrun',
  params: { reps, runMin, walkMin },
});
const et = (minutes: number): SessionSpec => ({ type: 'easy', params: { minutes } });
const ek = (km: number): SessionSpec => ({ type: 'easy', params: { km } });
const lt = (minutes: number): SessionSpec => ({ type: 'long', params: { minutes } });
const lk = (km: number): SessionSpec => ({ type: 'long', params: { km } });
const fl = (reps: number, fastMin: number, slowMin = 2): SessionSpec => ({
  type: 'fartlek',
  params: { warmMin: 10, reps, fastMin, slowMin, coolMin: 5 },
});
const tl = (tempoKm: number, pace: 'zügig' | 'HM-Tempo' = 'zügig'): SessionSpec => ({
  type: 'tempo',
  params: { warmKm: 1.5, tempoKm, coolKm: 1, pace },
});
const test = (km: number): SessionSpec => ({
  type: 'tempo',
  params: { warmKm: 1, tempoKm: km, coolKm: 1, pace: 'Test' },
});
const iv = (reps: number, meters: number, recoverSec = 120): SessionSpec => ({
  type: 'intervals',
  params: { warmKm: 2, reps, meters, recoverSec, coolKm: 1 },
});
const race = (km: number): SessionSpec => ({ type: 'race', params: { km } });

const L = (phase: PhaseId, kind: WeekKind, a: SessionSpec, b: SessionSpec, c: SessionSpec): LevelDef => ({
  phase,
  kind,
  days: [a, b, c],
});

// --- Gemeinsame Grundlage + Aufbau (Stufen 0–19) ---------------------------
const BASE: LevelDef[] = [
  // Phase 1: Grundlage – nach Zeit, Geh-Lauf bis 30+ min am Stück
  L('grundlage', 'build', wr(5, 4, 1), wr(5, 4, 1), wr(6, 4, 1)),
  L('grundlage', 'build', wr(5, 5, 1), wr(5, 5, 1), wr(4, 7, 1)),
  L('grundlage', 'build', wr(4, 7, 1), wr(4, 7, 1), wr(3, 10, 1)),
  L('grundlage', 'deload', wr(4, 5, 1), et(20), wr(3, 8, 1)),
  L('grundlage', 'build', et(20), et(20), lt(25)),
  L('grundlage', 'build', et(25), et(20), lt(30)),
  L('grundlage', 'build', et(25), et(25), lt(35)),
  L('grundlage', 'deload', et(20), et(20), lt(30)),
  // Phase 2: Aufbau – Wechsel auf Distanz, 5 km → 10 km
  L('aufbau', 'build', ek(4), ek(4), lk(5)),
  L('aufbau', 'build', ek(4), fl(6, 1), lk(6)),
  L('aufbau', 'build', ek(5), fl(6, 1), lk(7)),
  L('aufbau', 'deload', ek(4), ek(4), lk(5)),
  L('aufbau', 'build', ek(5), iv(6, 400), lk(8)),
  L('aufbau', 'build', ek(5), fl(8, 1), lk(9)),
  L('aufbau', 'build', ek(6), tl(2), lk(10)),
  L('aufbau', 'deload', ek(4), ek(4), test(5)),
  L('aufbau', 'build', ek(6), iv(6, 400), lk(10)),
  L('aufbau', 'build', ek(6), tl(3), lk(11)),
  L('aufbau', 'build', ek(6), fl(8, 1.5), lk(12)),
  L('aufbau', 'deload', ek(5), ek(5), lk(8)),
];

const HM: Template = {
  id: 'hm',
  name: 'Halbmarathon Einsteiger',
  description: 'Vom Geh-Lauf-Training bis zum Finish über 21,1 km.',
  raceKm: 21.1,
  levels: [
    ...BASE,
    // Phase 3: Halbmarathon-Vorbereitung
    L('ziel', 'build', ek(6), tl(3), lk(12)),
    L('ziel', 'build', ek(7), iv(5, 800, 150), lk(13)),
    L('ziel', 'build', ek(7), tl(4), lk(14)),
    L('ziel', 'deload', ek(5), ek(6), test(10)),
    L('ziel', 'build', ek(7), tl(4), lk(15)),
    L('ziel', 'build', ek(8), iv(6, 800, 150), lk(16)),
    L('ziel', 'build', ek(8), tl(5), lk(16)),
    L('ziel', 'deload', ek(6), ek(6), lk(12)),
    L('ziel', 'build', ek(8), tl(5, 'HM-Tempo'), lk(17)),
    L('ziel', 'build', ek(8), iv(5, 1000, 150), lk(18)),
    L('ziel', 'build', ek(8), tl(6, 'HM-Tempo'), lk(18)),
    L('ziel', 'deload', ek(6), ek(6), lk(12)),
    // Phase 4: Tapering & Wettkampf
    L('taper', 'taper', ek(7), tl(4, 'HM-Tempo'), lk(14)),
    L('taper', 'taper', ek(6), tl(3, 'HM-Tempo'), lk(10)),
    L('taper', 'race', ek(5), et(20), race(21.1)),
  ],
};

const TENK: Template = {
  id: '10k',
  name: '10 km Einsteiger',
  description: 'Vom Geh-Lauf-Training bis zum ersten 10-km-Lauf.',
  raceKm: 10,
  levels: [
    ...BASE.slice(0, 19),
    L('taper', 'taper', ek(5), tl(2), lk(7)),
    L('taper', 'race', ek(4), et(20), race(10)),
  ],
};

export const TEMPLATES: Record<TemplateId, Template> = { hm: HM, '10k': TENK };

export const PHASES: Record<PhaseId, { name: string; text: string }> = {
  grundlage: {
    name: 'Grundlage',
    text: 'Geh-Lauf-Intervalle, bis du 30–35 Minuten am Stück locker laufen kannst. Geplant wird nach Zeit, Tempo ist egal.',
  },
  aufbau: {
    name: 'Aufbau',
    text: 'Wechsel auf Distanz: von 5 auf 10–12 km beim langen Lauf. Erste lockere Tempowechsel (Fahrtspiel).',
  },
  ziel: {
    name: 'Halbmarathon-Vorbereitung',
    text: 'Der lange Lauf wächst auf 18 km. Tempoläufe gewöhnen dich an dein Wettkampftempo.',
  },
  taper: {
    name: 'Tapering & Wettkampf',
    text: 'Weniger Umfang, damit du ausgeruht und frisch an den Start gehst.',
  },
};
