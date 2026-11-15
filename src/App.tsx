import { useState } from 'react';
import { ExerciseSheet } from './components/ExerciseSheet';
import { MissedDialog } from './components/MissedDialog';
import { SessionSheet } from './components/SessionSheet';
import { Icon } from './components/ui';
import { currentWeekIndex } from './lib/plan';
import { useStore } from './store';
import { ExercisesView } from './views/ExercisesView';
import { PlanView } from './views/PlanView';
import { SettingsView } from './views/SettingsView';
import { Setup } from './views/Setup';
import { Timer } from './views/Timer';
import { Today } from './views/Today';
import { WeekView } from './views/WeekView';

type Tab = 'today' | 'week' | 'plan' | 'exercises' | 'settings';
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Heute' },
  { id: 'week', label: 'Woche' },
  { id: 'plan', label: 'Plan' },
  { id: 'exercises', label: 'Übungen' },
  { id: 'settings', label: 'Mehr' },
];

export default function App() {
  const { state, today } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [weekIdx, setWeekIdx] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [missed, setMissed] = useState<number | null>(null);

  if (!state) return <main className="app"><Setup /></main>;

  const openWeek = (i: number) => {
    setWeekIdx(i);
    setTab('week');
    window.scrollTo(0, 0);
  };
  const startTimer = (id: string) => {
    setSessionId(null);
    setTimerId(id);
  };

  if (timerId) return <Timer sessionId={timerId} onClose={() => setTimerId(null)} />;

  return (
    <>
      <main className="app">
        {tab === 'today' && <Today onSession={setSessionId} onStart={startTimer} onMissed={setMissed} onWeek={openWeek} />}
        {tab === 'week' && <WeekView index={weekIdx ?? currentWeekIndex(state.weeks, today)} setIndex={setWeekIdx} onSession={setSessionId} />}
        {tab === 'plan' && <PlanView onWeek={openWeek} />}
        {tab === 'exercises' && <ExercisesView onExercise={setExerciseId} />}
        {tab === 'settings' && <SettingsView onMissed={() => setMissed(1)} />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => {
              if (t.id === 'week' && tab !== 'week') setWeekIdx(null);
              setTab(t.id);
              window.scrollTo(0, 0);
            }}
          >
            <Icon name={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <SessionSheet key={sessionId ?? 'none'} id={sessionId} onClose={() => setSessionId(null)} onStart={startTimer} onExercise={setExerciseId} />
      <ExerciseSheet id={exerciseId} onClose={() => setExerciseId(null)} />
      {missed !== null && <MissedDialog open suggested={missed} onClose={() => setMissed(null)} />}
    </>
  );
}
