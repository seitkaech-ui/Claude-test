/**
 * Übungsbibliothek. Jede Übung hat zwei Schlüsselposen (A ↔ B), aus denen die Strichfigur
 * animiert wird. Winkel in Grad, absolut: 0 = senkrecht nach unten, +90 = nach vorne (rechts im Bild),
 * 180 = nach oben. Rumpf: 0 = aufrecht, +90 = nach vorne geneigt.
 * In der Seitenansicht ist "r" das vordere (dunkle), "l" das hintere (helle) Bein/Arm.
 */
export interface Pose {
  torso: number;
  head?: number;
  spine?: number; // Rundung des Rückens (+ = Rundrücken)
  lThigh: number;
  lShin: number;
  rThigh: number;
  rShin: number;
  lUpper: number;
  lFore: number;
  rUpper: number;
  rFore: number;
  lFoot?: number;
  rFoot?: number;
  x?: number; // Hüftposition im Bild (0–100)
}

export type ExerciseCategory = 'warmup' | 'stretch' | 'mobility';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  view: 'side' | 'front';
  poses: [Pose, Pose];
  wall?: number;
  dose: string;
  steps: string[];
  tips: string[];
  mistakes: string[];
  hidden?: boolean;
}

const stand: Pose = {
  torso: 0, lThigh: 0, lShin: 0, rThigh: 0, rShin: 0,
  lUpper: 6, lFore: 14, rUpper: 4, rFore: 12,
};
const runArmsA = { lUpper: 35, lFore: 120, rUpper: -40, rFore: 40 };
const runArmsB = { rUpper: 35, rFore: 120, lUpper: -40, lFore: 40 };

export const EXERCISES: Exercise[] = [
  // ---------------- Einwärmen (dynamisch) ----------------
  {
    id: 'gehen',
    name: 'Zügiges Gehen',
    category: 'warmup',
    view: 'side',
    poses: [
      { ...stand, rThigh: 25, rShin: 10, rFoot: 105, lThigh: -20, lShin: -35, lFoot: 70, lUpper: 22, lFore: 45, rUpper: -22, rFore: -5 },
      { ...stand, lThigh: 25, lShin: 10, lFoot: 105, rThigh: -20, rShin: -35, rFoot: 70, rUpper: 22, rFore: 45, lUpper: -22, lFore: -5 },
    ],
    dose: '2 min',
    steps: ['Gehe zügig mit grossen, lockeren Schritten.', 'Arme schwingen locker mit.', 'Der Puls darf leicht ansteigen.'],
    tips: ['Aufrecht gehen, Blick nach vorne.'],
    mistakes: ['Zu gemütlich schlendern – es soll den Kreislauf in Schwung bringen.'],
  },
  {
    id: 'armkreisen',
    name: 'Armkreisen',
    category: 'warmup',
    view: 'front',
    poses: [
      { ...stand, lThigh: -4, lShin: -4, rThigh: 4, rShin: 4, lUpper: -165, lFore: -170, rUpper: 165, rFore: 170 },
      { ...stand, lThigh: -4, lShin: -4, rThigh: 4, rShin: 4, lUpper: -18, lFore: -12, rUpper: 18, rFore: 12 },
    ],
    dose: '30 s (je 10× vorwärts und rückwärts)',
    steps: [
      'Hüftbreit hinstellen, Knie leicht gebeugt.',
      'Beide Arme gestreckt in grossen Kreisen nach vorne schwingen.',
      'Nach der Hälfte die Richtung wechseln.',
    ],
    tips: ['Schultern bleiben locker und tief.'],
    mistakes: ['Hohlkreuz machen', 'Zu schnell und hektisch kreisen'],
  },
  {
    id: 'hueftkreisen',
    name: 'Hüftkreisen',
    category: 'warmup',
    view: 'front',
    poses: [
      { ...stand, x: 54, torso: -12, lThigh: -5.5, lShin: -5.5, rThigh: -5.5, rShin: -5.5, lUpper: -45, lFore: 60, rUpper: 45, rFore: -60 },
      { ...stand, x: 46, torso: 12, lThigh: 5.5, lShin: 5.5, rThigh: 5.5, rShin: 5.5, lUpper: -45, lFore: 60, rUpper: 45, rFore: -60 },
    ],
    dose: '30 s (je 8× pro Richtung)',
    steps: [
      'Hüftbreiter Stand, Hände in die Hüften.',
      'Becken in grossen, ruhigen Kreisen bewegen.',
      'Nach der Hälfte die Richtung wechseln.',
    ],
    tips: ['Oberkörper bleibt möglichst ruhig, die Bewegung kommt aus der Hüfte.'],
    mistakes: ['Nur mit dem Oberkörper wackeln'],
  },
  {
    id: 'beinpendeln',
    name: 'Beinpendeln',
    category: 'warmup',
    view: 'side',
    poses: [
      { ...stand, x: 44, torso: -3, rThigh: 55, rShin: 45, rFoot: 120, lUpper: 40, lFore: 80, rUpper: -30, rFore: 20 },
      { ...stand, x: 44, torso: 6, rThigh: -35, rShin: -30, rFoot: 40, lUpper: -30, lFore: 20, rUpper: 35, rFore: 80 },
    ],
    dose: '30 s pro Seite (ca. 12 Schwünge)',
    steps: [
      'Auf ein Bein stellen, bei Bedarf an einer Wand oder einem Baum festhalten.',
      'Das andere Bein locker vor und zurück pendeln lassen.',
      'Die Schwünge langsam grösser werden lassen, dann Seite wechseln.',
    ],
    tips: ['Standbein leicht gebeugt, Oberkörper aufrecht.'],
    mistakes: ['Mit Schwung ins Hohlkreuz fallen', 'Zu grosse Schwünge von Anfang an'],
  },
  {
    id: 'wadenheben',
    name: 'Fussheben (Zehenstand)',
    category: 'warmup',
    view: 'side',
    poses: [
      { ...stand, lFoot: 90, rFoot: 90 },
      { ...stand, lFoot: 35, rFoot: 35, lUpper: 0, lFore: 2, rUpper: 0, rFore: 2 },
    ],
    dose: '40 s (ca. 15 Wiederholungen)',
    steps: [
      'Hüftbreit hinstellen.',
      'Langsam auf die Zehenspitzen hochdrücken.',
      'Kurz halten und kontrolliert wieder absenken.',
    ],
    tips: ['Weckt Waden und Achillessehne auf – wichtig für Läufer.'],
    mistakes: ['Ruckartig hochfedern', 'Fussgelenke knicken nach aussen'],
  },
  {
    id: 'ausfallschritt',
    name: 'Ausfallschritte',
    category: 'warmup',
    view: 'side',
    poses: [
      { ...stand, x: 38, lUpper: -25, lFore: 40, rUpper: -25, rFore: 40 },
      {
        torso: 0, x: 38, rThigh: 88, rShin: 0, rFoot: 90, lThigh: -20, lShin: -100, lFoot: 10,
        lUpper: -25, lFore: 40, rUpper: -25, rFore: 40,
      },
    ],
    dose: '60 s (ca. 6 pro Bein, abwechselnd)',
    steps: [
      'Aus dem aufrechten Stand einen grossen Schritt nach vorne machen.',
      'Das hintere Knie senkt sich Richtung Boden, ohne ihn zu berühren.',
      'Kraftvoll zurückdrücken und Bein wechseln.',
    ],
    tips: ['Oberkörper bleibt aufrecht, Blick geradeaus.'],
    mistakes: ['Vorderes Knie schiebt weit über die Zehen hinaus', 'Knie knickt nach innen'],
  },
  {
    id: 'kniehebelauf',
    name: 'Kniehebelauf',
    category: 'warmup',
    view: 'side',
    poses: [
      { torso: 5, rThigh: 90, rShin: 0, rFoot: 60, lThigh: 0, lShin: 0, lFoot: 70, ...runArmsA },
      { torso: 5, lThigh: 90, lShin: 0, lFoot: 60, rThigh: 0, rShin: 0, rFoot: 70, ...runArmsB },
    ],
    dose: '30 s',
    steps: [
      'Auf der Stelle oder langsam vorwärts laufen.',
      'Die Knie abwechselnd bis etwa Hüfthöhe anheben.',
      'Auf den Fussballen landen, Arme schwingen aktiv mit.',
    ],
    tips: ['Lieber kleine, saubere Bewegungen als hohe, unkontrollierte.'],
    mistakes: ['Nach hinten lehnen', 'Auf der Ferse landen'],
  },
  {
    id: 'anfersen',
    name: 'Anfersen',
    category: 'warmup',
    view: 'side',
    poses: [
      { torso: 5, rThigh: -5, rShin: -160, rFoot: -110, lThigh: 0, lShin: 0, lFoot: 70, ...runArmsA },
      { torso: 5, lThigh: -5, lShin: -160, lFoot: -110, rThigh: 0, rShin: 0, rFoot: 70, ...runArmsB },
    ],
    dose: '30 s',
    steps: [
      'Locker auf der Stelle oder langsam vorwärts laufen.',
      'Die Fersen abwechselnd Richtung Po ziehen.',
      'Oberschenkel zeigen dabei nach unten.',
    ],
    tips: ['Locker und schnell, ohne Kraft.'],
    mistakes: ['Oberkörper fällt nach vorne', 'Knie wandern nach vorne'],
  },

  // ---------------- Dehnen (statisch, nach dem Lauf) ----------------
  {
    id: 'waden',
    name: 'Wadendehnung an der Wand',
    category: 'stretch',
    view: 'side',
    wall: 77,
    poses: [
      { torso: 18, x: 41, rThigh: 35, rShin: 5, rFoot: 90, lThigh: -25, lShin: -25, lFoot: 90, lUpper: 72, lFore: 80, rUpper: 75, rFore: 82 },
      { torso: 24, x: 38, rThigh: 42, rShin: 10, rFoot: 90, lThigh: -30, lShin: -30, lFoot: 90, lUpper: 72, lFore: 80, rUpper: 75, rFore: 82 },
    ],
    dose: '30 s pro Seite',
    steps: [
      'Mit beiden Händen an einer Wand (oder einem Baum) abstützen.',
      'Ein Bein weit nach hinten stellen, Ferse bleibt am Boden, Bein gestreckt.',
      'Hüfte nach vorne schieben, bis du ein Ziehen in der Wade spürst. Halten, dann wechseln.',
    ],
    tips: ['Hintere Fussspitze zeigt gerade nach vorne.', 'Ruhig weiteratmen.'],
    mistakes: ['Ferse hebt ab', 'Wippen statt halten'],
  },
  {
    id: 'quadrizeps',
    name: 'Oberschenkel vorne',
    category: 'stretch',
    view: 'side',
    poses: [
      { ...stand, x: 48, torso: 2, rThigh: -5, rShin: -165, rFoot: -100, rUpper: -15, rFore: -15, lUpper: 75, lFore: 85 },
      { ...stand, x: 48, torso: 0, rThigh: -10, rShin: -165, rFoot: -100, rUpper: -19, rFore: -19, lUpper: 75, lFore: 85 },
    ],
    dose: '30 s pro Seite',
    steps: [
      'Auf ein Bein stellen (bei Bedarf festhalten).',
      'Den Fuss des anderen Beins greifen und die Ferse Richtung Po ziehen.',
      'Knie zeigen nach unten und bleiben nebeneinander. Bauch leicht anspannen. Halten, dann wechseln.',
    ],
    tips: ['Becken leicht nach vorne schieben verstärkt die Dehnung.'],
    mistakes: ['Hohlkreuz', 'Knie wandert nach vorne oder zur Seite'],
  },
  {
    id: 'hamstrings',
    name: 'Oberschenkel hinten',
    category: 'stretch',
    view: 'side',
    poses: [
      { torso: 45, x: 40, rThigh: 35, rShin: 35, rFoot: 150, lThigh: -30, lShin: 40, lFoot: 90, lUpper: -16, lFore: -30, rUpper: -18, rFore: -30 },
      { torso: 58, x: 40, rThigh: 35, rShin: 35, rFoot: 150, lThigh: -30, lShin: 40, lFoot: 90, lUpper: -20, lFore: -34, rUpper: -22, rFore: -34 },
    ],
    dose: '30 s pro Seite',
    steps: [
      'Ein Bein gestreckt nach vorne stellen, Ferse am Boden, Zehen zeigen nach oben.',
      'Das hintere Bein beugen, Hände auf den Oberschenkel.',
      'Mit geradem Rücken den Oberkörper nach vorne neigen, bis es hinten im Oberschenkel zieht.',
    ],
    tips: ['Der Rücken bleibt lang – die Bewegung kommt aus der Hüfte.'],
    mistakes: ['Runder Rücken', 'Auf das gestreckte Knie drücken'],
  },
  {
    id: 'hueftbeuger',
    name: 'Hüftbeuger (kniender Ausfallschritt)',
    category: 'stretch',
    view: 'side',
    poses: [
      { torso: -3, x: 45, rThigh: 90, rShin: 0, rFoot: 90, lThigh: -5, lShin: -90, lFoot: -90, lUpper: 40, lFore: 44, rUpper: 40, rFore: 44 },
      { torso: -6, x: 45, rThigh: 100, rShin: 12, rFoot: 90, lThigh: -35, lShin: -90, lFoot: -90, lUpper: 45, lFore: 50, rUpper: 45, rFore: 50 },
    ],
    dose: '30 s pro Seite',
    steps: [
      'In einen Ausfallschritt gehen und das hintere Knie auf dem Boden ablegen (evtl. auf einer Jacke).',
      'Das vordere Knie steht über dem Fussgelenk.',
      'Becken langsam nach vorne unten schieben, bis es vorne in der Leiste des hinteren Beins zieht.',
    ],
    tips: ['Po leicht anspannen – das verstärkt die Dehnung.', 'Gerade für Läufer, die viel sitzen, sehr wichtig.'],
    mistakes: ['Hohlkreuz', 'Vorderes Knie weit über den Zehen'],
  },
  {
    id: 'adduktoren',
    name: 'Innenseite Oberschenkel',
    category: 'stretch',
    view: 'front',
    poses: [
      { torso: 0, x: 54, lThigh: -30, lShin: -30, rThigh: 40, rShin: -15, lUpper: -10, lFore: -5, rUpper: 20, rFore: 25 },
      { torso: 0, x: 58, lThigh: -38, lShin: -38, rThigh: 55, rShin: 0, lUpper: -8, lFore: -2, rUpper: 25, rFore: 30 },
    ],
    dose: '20 s pro Seite',
    steps: [
      'Breitbeinig hinstellen, Fussspitzen zeigen leicht nach aussen.',
      'Das Gewicht auf ein Bein verlagern und dieses beugen, das andere bleibt gestreckt.',
      'Halten, bis es innen im gestreckten Bein zieht, dann Seite wechseln.',
    ],
    tips: ['Oberkörper aufrecht, Hände auf den Oberschenkeln.'],
    mistakes: ['Gebeugtes Knie knickt nach innen'],
  },
  {
    id: 'gesaess',
    name: 'Gesäss & unterer Rücken',
    category: 'stretch',
    view: 'side',
    poses: [
      { torso: -90, head: 40, x: 46, lThigh: 90, lShin: 90, lFoot: 180, rThigh: 190, rShin: 70, rFoot: 150, lUpper: 134, lFore: 134, rUpper: 134, rFore: 134 },
      { torso: -90, head: 40, x: 46, lThigh: 90, lShin: 90, lFoot: 180, rThigh: 200, rShin: 60, rFoot: 150, lUpper: 138, lFore: 138, rUpper: 138, rFore: 138 },
    ],
    dose: '30 s pro Seite',
    steps: [
      'Auf den Rücken legen (z. B. auf eine Matte oder zu Hause).',
      'Ein Knie mit beiden Händen zur Brust ziehen, das andere Bein bleibt lang.',
      'Ruhig atmen und halten, dann Seite wechseln.',
    ],
    tips: ['Kopf und Schultern bleiben entspannt am Boden.'],
    mistakes: ['Mit Kraft ziehen – sanft halten genügt'],
  },

  // ---------------- Mobility ----------------
  {
    id: 'katzekuh',
    name: 'Katze-Kuh',
    category: 'mobility',
    view: 'side',
    poses: [
      { torso: 78, spine: 7, head: 25, x: 40, rThigh: 0, rShin: -90, rFoot: -90, lThigh: 2, lShin: -90, lFoot: -90, rUpper: 0, rFore: 0, lUpper: 2, lFore: 2 },
      { torso: 76, spine: -5, head: -35, x: 40, rThigh: 0, rShin: -90, rFoot: -90, lThigh: 2, lShin: -90, lFoot: -90, rUpper: 0, rFore: 0, lUpper: 2, lFore: 2 },
    ],
    dose: '60 s (langsam, ca. 8 Wiederholungen)',
    steps: [
      'Vierfüsslerstand: Hände unter den Schultern, Knie unter der Hüfte.',
      'Ausatmen: Rücken rund machen wie eine Katze, Kinn zur Brust.',
      'Einatmen: Rücken sanft durchhängen lassen, Blick leicht nach vorne oben.',
    ],
    tips: ['Bewegung mit dem Atem verbinden, ganz langsam.'],
    mistakes: ['Ellbogen durchdrücken', 'Zu schnell wechseln'],
  },
  {
    id: 'beckenheben',
    name: 'Beckenheben (Glute Bridge)',
    category: 'mobility',
    view: 'side',
    poses: [
      { torso: -95, head: 55, x: 50, rThigh: 150, rShin: 15, rFoot: 90, lThigh: 148, lShin: 15, lFoot: 90, rUpper: 90, rFore: 90, lUpper: 90, lFore: 90 },
      { torso: -115, head: 70, x: 45, rThigh: 115, rShin: 5, rFoot: 90, lThigh: 113, lShin: 5, lFoot: 90, rUpper: 85, rFore: 90, lUpper: 85, lFore: 90 },
    ],
    dose: '60 s (ca. 12 Wiederholungen)',
    steps: [
      'Auf den Rücken legen, Beine anwinkeln, Füsse hüftbreit aufstellen.',
      'Po anspannen und das Becken anheben, bis Knie, Hüfte und Schultern eine Linie bilden.',
      'Kurz halten und langsam wieder absenken.',
    ],
    tips: ['Kräftigt Po und Rumpf – das stabilisiert beim Laufen Knie und Hüfte.'],
    mistakes: ['Ins Hohlkreuz drücken', 'Knie fallen nach aussen'],
  },

  // ---------------- nur für den Timer ----------------
  {
    id: 'laufen',
    name: 'Laufen',
    category: 'warmup',
    view: 'side',
    hidden: true,
    poses: [
      { torso: 8, rThigh: 45, rShin: -5, rFoot: 100, lThigh: -25, lShin: -85, lFoot: -40, ...runArmsA },
      { torso: 8, lThigh: 45, lShin: -5, lFoot: 100, rThigh: -25, rShin: -85, rFoot: -40, ...runArmsB },
    ],
    dose: '',
    steps: [],
    tips: [],
    mistakes: [],
  },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const CATEGORY_NAMES: Record<ExerciseCategory, string> = {
  warmup: 'Einwärmen (vor dem Lauf)',
  stretch: 'Dehnen (nach dem Lauf)',
  mobility: 'Mobility (Ruhetag)',
};

// ---------------- Routinen ----------------
export interface RoutineItem {
  id: string;
  sec: number; // pro Seite, falls perSide
  perSide?: boolean;
  label?: string;
}

export const WARMUP: RoutineItem[] = [
  { id: 'gehen', sec: 120 },
  { id: 'armkreisen', sec: 30 },
  { id: 'hueftkreisen', sec: 30 },
  { id: 'beinpendeln', sec: 30, perSide: true },
  { id: 'wadenheben', sec: 40 },
  { id: 'ausfallschritt', sec: 60 },
  { id: 'kniehebelauf', sec: 30 },
  { id: 'anfersen', sec: 30 },
];

export const COOLDOWN: RoutineItem[] = [
  { id: 'gehen', sec: 120, label: 'Auslaufen / locker gehen' },
  { id: 'waden', sec: 30, perSide: true },
  { id: 'quadrizeps', sec: 30, perSide: true },
  { id: 'hamstrings', sec: 30, perSide: true },
  { id: 'hueftbeuger', sec: 30, perSide: true },
  { id: 'adduktoren', sec: 20, perSide: true },
  { id: 'gesaess', sec: 30, perSide: true },
];

export const MOBILITY: RoutineItem[] = [
  { id: 'katzekuh', sec: 60 },
  { id: 'beckenheben', sec: 60 },
  { id: 'armkreisen', sec: 30 },
  { id: 'hueftkreisen', sec: 30 },
  { id: 'beinpendeln', sec: 30, perSide: true },
  { id: 'ausfallschritt', sec: 60 },
  { id: 'wadenheben', sec: 45 },
  { id: 'katzekuh', sec: 45 },
  { id: 'beckenheben', sec: 60 },
  { id: 'waden', sec: 30, perSide: true },
  { id: 'quadrizeps', sec: 30, perSide: true },
  { id: 'hamstrings', sec: 40, perSide: true },
  { id: 'hueftbeuger', sec: 40, perSide: true },
  { id: 'adduktoren', sec: 30, perSide: true },
  { id: 'gesaess', sec: 40, perSide: true },
];

export const routineSeconds = (r: RoutineItem[]) => r.reduce((a, it) => a + it.sec * (it.perSide ? 2 : 1), 0);
