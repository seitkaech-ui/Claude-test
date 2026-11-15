import { describe, expect, it } from 'vitest';
import { addDays } from './date';
import {
  buildSequence,
  createPlan,
  defaultSettings,
  detectMissedWeeks,
  fallbackLevel,
  moveSession,
  recalculate,
  weekStarts,
  weekWarnings,
} from './plan';
import { TEMPLATES } from './templates';

const TODAY = '2026-11-15'; // Sonntag
const settings = defaultSettings(TODAY);

describe('Planerstellung', () => {
  const plan = createPlan(settings, TODAY);

  it('beginnt am nächsten Montag, wenn diese Woche kein Trainingstag mehr übrig ist', () => {
    expect(plan.weeks[0].start).toBe('2026-11-16');
    expect(plan.weeks[0].sessions[0].date).toBe('2026-11-16');
  });

  it('endet mit dem Wettkampf am Wettkampftag', () => {
    const last = plan.weeks[plan.weeks.length - 1];
    const race = last.sessions.find((s) => s.type === 'race');
    expect(race?.date).toBe('2027-09-19');
    expect(race?.params.km).toBe(21.1);
  });

  it('nutzt Mo/Mi/Sa und eine optionale Mobility-Session am Sonntag', () => {
    const days = plan.weeks[0].sessions.map((s) => [s.date, s.type, !!s.optional]);
    expect(days).toEqual([
      ['2026-11-16', 'walkrun', false],
      ['2026-11-18', 'walkrun', false],
      ['2026-11-21', 'walkrun', false],
      ['2026-11-22', 'mobility', true],
    ]);
  });

  it('enthält Pufferwochen (Festigungswochen) und keine Warnung', () => {
    expect(plan.weeks.length).toBe(weekStarts(settings).length);
    expect(plan.weeks.some((w) => w.repeat)).toBe(true);
    expect(plan.warning).toBeUndefined();
  });

  it('Einwärmen und Dehnen sind bei Läufen aktiv', () => {
    const run = plan.weeks[0].sessions[0];
    expect(run.warmup && run.cooldown).toBe(true);
  });
});

describe('buildSequence', () => {
  const levels = TEMPLATES.hm.levels;
  it('füllt exakt die verfügbaren Wochen', () => {
    for (const n of [10, 20, 35, 44, 60]) expect(buildSequence(levels, 0, n).seq.length).toBe(n);
  });
  it('streicht bei Zeitmangel Aufbauwochen, nie den Wettkampf', () => {
    const { seq, dropped } = buildSequence(levels, 0, 20);
    expect(dropped).toBe(levels.length - 20);
    expect(seq[seq.length - 1].level).toBe(levels.length - 1);
  });
});

describe('Ausfall & Neuberechnung', () => {
  it('Rückstufungsregeln', () => {
    expect(fallbackLevel(10, 1)).toBe(10);
    expect(fallbackLevel(10, 2)).toBe(9);
    expect(fallbackLevel(10, 5)).toBe(7);
  });

  it('erkennt eine verpasste Woche und wiederholt die letzte geschaffte Stufe', () => {
    let plan = createPlan(settings, TODAY);
    // Wochen 0–2 erledigt, Woche 3 verpasst, heute in Woche 4
    plan.weeks.slice(0, 3).forEach((w) => w.sessions.forEach((s) => (s.status = 'done')));
    const today = addDays(plan.weeks[4].start, 1);
    expect(detectMissedWeeks(plan.weeks, today)).toBe(1);
    const lastLevel = plan.weeks[2].level;
    plan = recalculate(plan, 1, today);
    expect(plan.weeks[4].level).toBe(lastLevel);
    expect(plan.weeks[3].sessions.every((s) => s.status === 'skipped')).toBe(true);
    expect(plan.weeks[plan.weeks.length - 1].sessions.some((s) => s.type === 'race')).toBe(true);
    expect(plan.weeks.length).toBe(weekStarts(settings).length);
  });
});

describe('Verschieben', () => {
  it('warnt bei zwei harten Einheiten hintereinander', () => {
    const plan = createPlan(settings, TODAY);
    const w = plan.weeks.find((x) => x.sessions.some((s) => s.type === 'intervals'))!;
    const iv = w.sessions.find((s) => s.type === 'intervals')!;
    const moved = moveSession(w, iv.id, 4); // Freitag, langer Lauf am Samstag
    expect(weekWarnings(moved).length).toBeGreaterThan(0);
  });
});
