import { CATEGORY_NAMES, EXERCISE_BY_ID } from '../data/exercises';
import { ExerciseFigure, KeyPoses } from './StickFigure';
import { Sheet } from './ui';

export function ExerciseSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const ex = id ? EXERCISE_BY_ID[id] : null;
  if (!ex) return null;
  return (
    <Sheet open onClose={onClose} title={ex.name}>
      <p className="kicker">{CATEGORY_NAMES[ex.category]} · {ex.dose}</p>
      <div className="figure-stage">
        <ExerciseFigure exercise={ex} size={200} />
      </div>
      <KeyPoses exercise={ex} />
      <h4>So geht’s</h4>
      <ol className="steps">{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      {ex.tips.length > 0 && (
        <>
          <h4>Tipps</h4>
          <ul className="plain good">{ex.tips.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      )}
      {ex.mistakes.length > 0 && (
        <>
          <h4>Typische Fehler</h4>
          <ul className="plain bad">{ex.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      )}
      <p className="muted small">Dehnen: sanft bis zu einem leichten Ziehen, nie bis zum Schmerz. Nicht wippen.</p>
    </Sheet>
  );
}
