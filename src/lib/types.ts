export type SessionType =
  | 'walkrun'
  | 'easy'
  | 'long'
  | 'fartlek'
  | 'tempo'
  | 'intervals'
  | 'race'
  | 'mobility'
  | 'cross';

/** Flache Parameter – je nach Typ werden nur einige genutzt. */
export interface SessionParams {
  // Geh-Lauf
  reps?: number;
  runMin?: number;
  walkMin?: number;
  // Dauer- / langer Lauf / Alternativtraining (entweder Zeit oder Distanz)
  minutes?: number;
  km?: number;
  // Fahrtspiel
  warmMin?: number;
  fastMin?: number;
  slowMin?: number;
  coolMin?: number;
  // Tempo / Intervalle
  warmKm?: number;
  tempoKm?: number;
  coolKm?: number;
  pace?: 'zügig' | 'HM-Tempo' | 'Test';
  meters?: number;
  recoverSec?: number;
  // Alternativtraining
  activity?: string;
}

export type SessionStatus = 'planned' | 'done' | 'skipped';

export interface SessionResult {
  minutes?: number;
  km?: number;
  feeling?: number; // 1 (sehr schwer) … 5 (super)
  note?: string;
  completedAt: string;
}

export interface Session {
  id: string;
  date: string;
  type: SessionType;
  params: SessionParams;
  /** eigener Titel (sonst automatisch) */
  title?: string;
  notes?: string;
  warmup: boolean;
  cooldown: boolean;
  optional?: boolean;
  status: SessionStatus;
  result?: SessionResult;
}

export type PhaseId = 'grundlage' | 'aufbau' | 'ziel' | 'taper';
export type WeekKind = 'build' | 'deload' | 'taper' | 'race';

export interface Week {
  start: string; // Montag
  level: number;
  phase: PhaseId;
  kind: WeekKind;
  repeat: boolean; // Festigungswoche (Wiederholung einer Stufe)
  sessions: Session[];
}

export type TemplateId = 'hm' | '10k';

export interface Settings {
  templateId: TemplateId;
  startDate: string;
  raceDate: string;
  trainingDays: number[]; // 0 = Mo … 6 = So, 2 oder 3 Tage
  mobility: boolean;
  mobilityDay: number;
  voice: boolean;
  reminderTime: string; // "18:00"
  reminderMinutes: number; // Erinnerung x min vorher
}

export interface AppState {
  version: 1;
  settings: Settings;
  weeks: Week[];
  warning?: string;
  /** Wochenstart, für den der Hinweis „Plan anpassen?“ bereits erledigt ist */
  ackWeek?: string;
  createdAt: string;
}
