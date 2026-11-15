import { CATEGORY_NAMES, EXERCISES, type ExerciseCategory } from '../data/exercises';
import { ExerciseFigure } from '../components/StickFigure';

export function ExercisesView({ onExercise }: { onExercise: (id: string) => void }) {
  const cats: ExerciseCategory[] = ['warmup', 'stretch', 'mobility'];
  return (
    <div className="view">
      <header>
        <h1>Übungen</h1>
        <p className="muted">Tippe auf eine Übung für Anleitung, Tipps und typische Fehler.</p>
      </header>
      {cats.map((c) => (
        <section key={c}>
          <h2>{CATEGORY_NAMES[c]}</h2>
          <div className="ex-grid">
            {EXERCISES.filter((e) => e.category === c && !e.hidden).map((e) => (
              <button key={e.id} className="ex-card" onClick={() => onExercise(e.id)}>
                <ExerciseFigure exercise={e} size={96} animate={false} />
                <span className="ex-name">{e.name}</span>
                <span className="small muted">{e.dose}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
