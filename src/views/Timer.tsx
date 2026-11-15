import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompleteForm } from '../components/SessionSheet';
import { ExerciseFigure } from '../components/StickFigure';
import { Icon } from '../components/ui';
import { EXERCISE_BY_ID } from '../data/exercises';
import { sessionTitle } from '../lib/session';
import { buildSteps, PART_NAMES, type Step } from '../lib/steps';
import type { SessionResult } from '../lib/types';
import { findSession, useStore } from '../store';

const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Signale: Ton (Web Audio), Vibration, Sprachansage */
function useSignals(voice: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  const unlock = useCallback(() => {
    try {
      if (!ctx.current) ctx.current = new AudioContext();
      if (ctx.current.state === 'suspended') ctx.current.resume();
    } catch { /* kein Audio */ }
  }, []);
  const beep = useCallback((freq = 880, dur = 0.15) => {
    const c = ctx.current;
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }, []);
  const announce = useCallback((text: string) => {
    beep(660, 0.12);
    setTimeout(() => beep(990, 0.25), 160);
    try { navigator.vibrate?.([250, 120, 250]); } catch { /* egal */ }
    if (voice && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE';
      setTimeout(() => speechSynthesis.speak(u), 450);
    }
  }, [beep, voice]);
  return { unlock, beep, announce };
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const req = () => navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
    req();
    const onVis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

const spoken = (s: Step) => {
  if (s.cue === 'exercise') return s.label.replace(' – ', ', ');
  if (s.label === 'Laufen') return 'Jetzt laufen';
  if (s.label === 'Gehen') return 'Jetzt gehen';
  return s.label;
};

export function Timer({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { state, update } = useStore();
  const found = state ? findSession(state, sessionId) : null;
  const session = found?.session;
  const steps = useMemo(() => (session ? buildSteps(session) : []), [session]);
  const { unlock, beep, announce } = useSignals(state?.settings.voice ?? true);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [stepStart, setStepStart] = useState(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const mainSec = useRef(0);
  const lastBeep = useRef(-1);

  useWakeLock(started && !finished);

  const step = steps[idx];
  const elapsed = ((pausedAt ?? now) - stepStart) / 1000;
  const remaining = step?.seconds !== undefined ? step.seconds - elapsed : undefined;

  const goTo = useCallback((next: number, t = Date.now()) => {
    const cur = steps[idx];
    if (cur?.part === 'main') mainSec.current += Math.max(0, (t - stepStart) / 1000);
    lastBeep.current = -1;
    if (next >= steps.length) {
      setFinished(true);
      announce('Training beendet. Super gemacht!');
      return;
    }
    if (next < 0) return;
    setIdx(next);
    setStepStart(t);
    setPausedAt(null);
    announce(spoken(steps[next]));
  }, [steps, idx, stepStart, announce]);

  // Taktgeber – rechnet mit Zeitstempeln, damit nichts „wegdriftet“
  useEffect(() => {
    if (!started || finished || pausedAt !== null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [started, finished, pausedAt]);

  useEffect(() => {
    if (!started || finished || pausedAt !== null || remaining === undefined) return;
    if (remaining <= 0) {
      goTo(idx + 1, stepStart + (step!.seconds ?? 0) * 1000);
      return;
    }
    const sec = Math.ceil(remaining);
    if (sec <= 3 && sec !== lastBeep.current) {
      lastBeep.current = sec;
      beep(520, 0.1);
    }
  }, [now, remaining, started, finished, pausedAt, goTo, idx, stepStart, step, beep]);

  if (!session || !state) return null;

  const start = () => {
    unlock();
    const t = Date.now();
    setStarted(true);
    setStepStart(t);
    setNow(t);
    announce(spoken(steps[0]));
  };
  const togglePause = () => {
    if (pausedAt === null) setPausedAt(Date.now());
    else {
      setStepStart((s) => s + (Date.now() - pausedAt));
      setPausedAt(null);
      setNow(Date.now());
    }
  };
  const quit = () => {
    if (!started || finished || confirm('Training abbrechen?')) {
      try { speechSynthesis.cancel(); } catch { /* egal */ }
      onClose();
    }
  };
  const save = (r: SessionResult) => {
    update((d) => {
      const f = findSession(d, sessionId)!;
      f.session.status = 'done';
      f.session.result = r;
    });
    onClose();
  };

  const totalPlanned = steps.reduce((a, s) => a + (s.seconds ?? 0), 0);
  const nextStep = steps[idx + 1];
  const ex = step?.exerciseId ? EXERCISE_BY_ID[step.exerciseId] : undefined;
  const pct = step?.seconds ? Math.min(100, (elapsed / step.seconds) * 100) : 0;

  return (
    <div className={`timer cue-${finished ? 'done' : step?.cue}`}>
      <div className="timer-top">
        <button className="icon-btn" onClick={quit} aria-label="Beenden"><Icon name="close" /></button>
        <div className="timer-title">
          <span className="small">{sessionTitle(session)}</span>
          {!finished && started && <span className="small">Schritt {idx + 1} / {steps.length}</span>}
        </div>
        <span style={{ width: 40 }} />
      </div>

      {!started && (
        <div className="timer-body">
          <h2>Bereit?</h2>
          <p>
            {steps.length} Schritte · ca. {Math.round(totalPlanned / 60)} min mit Timer
            {steps.some((s) => s.seconds === undefined) && ' + Strecken, die du selbst mit „Weiter“ abschliesst'}
          </p>
          <ul className="plain timer-overview">
            {(['warmup', 'main', 'cooldown'] as const).map((p) => {
              const n = steps.filter((s) => s.part === p);
              return n.length ? <li key={p}><strong>{PART_NAMES[p]}</strong> · {n.length} Schritte</li> : null;
            })}
          </ul>
          <p className="small">Der Bildschirm bleibt an. Ton & Vibration kündigen jeden Wechsel an – Kopfhörer empfohlen.</p>
          <button className="btn big light" onClick={start}><Icon name="play" /> Los geht’s</button>
        </div>
      )}

      {started && !finished && step && (
        <div className="timer-body">
          <span className="part-badge">{PART_NAMES[step.part]}</span>
          <h2 className="step-label">{step.label}</h2>
          {ex && <div className="timer-figure"><ExerciseFigure exercise={ex} size={170} /></div>}
          <div className="clock" aria-live="polite">{remaining !== undefined ? mmss(remaining) : mmss(elapsed)}</div>
          {step.seconds !== undefined ? (
            <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          ) : (
            <p className="small">Stoppuhr läuft – tippe „Weiter“, wenn du fertig bist.</p>
          )}
          {step.detail && <p className="step-detail">{step.detail}</p>}
          {pausedAt !== null && <p className="paused">⏸ Pausiert</p>}
          {nextStep && <p className="next">Danach: {nextStep.label}{nextStep.seconds ? ` (${mmss(nextStep.seconds)})` : ''}</p>}
        </div>
      )}

      {started && !finished && (
        <div className="timer-controls">
          <button className="round" onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label="Zurück"><Icon name="prev" /></button>
          <button className="round main" onClick={togglePause} aria-label={pausedAt === null ? 'Pause' : 'Weiter'}>
            <Icon name={pausedAt === null ? 'pause' : 'play'} size={30} />
          </button>
          <button className="round" onClick={() => goTo(idx + 1)} aria-label="Nächster Schritt"><Icon name="next" /></button>
        </div>
      )}

      {finished && (
        <div className="timer-body finish">
          <h2>Geschafft! 🎉</h2>
          <div className="finish-form">
            <CompleteForm session={session} prefill={{ minutes: Math.round(mainSec.current / 60) || undefined }} onCancel={onClose} onSave={save} />
          </div>
        </div>
      )}
    </div>
  );
}
