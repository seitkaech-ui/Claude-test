import { useEffect, useRef, useState } from 'react';
import type { Exercise, Pose } from '../data/exercises';

const LEN = { torso: 28, thigh: 21, shin: 21, upper: 14, fore: 13, foot: 6, neck: 8, head: 6 };
const GROUND = 92;
type P = [number, number];

const rad = (a: number) => (a * Math.PI) / 180;
const limb = (from: P, a: number, len: number): P => [from[0] + len * Math.sin(rad(a)), from[1] + len * Math.cos(rad(a))];

function fill(p: Pose, view: 'side' | 'front'): Required<Pose> {
  const foot = view === 'side' ? 90 : 0;
  return {
    head: 0, spine: 0, x: 50,
    lFoot: view === 'side' ? foot : -80,
    rFoot: view === 'side' ? foot : 80,
    ...p,
  } as Required<Pose>;
}

export function lerpPose(a: Required<Pose>, b: Required<Pose>, t: number): Required<Pose> {
  const out = { ...a };
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => {
    out[k] = a[k] + (b[k] - a[k]) * t;
  });
  return out;
}

function geometry(p: Required<Pose>, view: 'side' | 'front') {
  const t = rad(p.torso);
  const td: P = [Math.sin(t), -Math.cos(t)];
  const right: P = [Math.cos(t), Math.sin(t)];
  const hip: P = [0, 0];
  const neck: P = [td[0] * LEN.torso, td[1] * LEN.torso];
  const sh: P = [td[0] * (LEN.torso - 3), td[1] * (LEN.torso - 3)];
  const ha = rad(p.torso + p.head);
  const head: P = [neck[0] + Math.sin(ha) * LEN.neck, neck[1] - Math.cos(ha) * LEN.neck];
  const perpUp: P = [-Math.cos(t), -Math.sin(t)];
  const ctrl: P = [neck[0] / 2 + perpUp[0] * p.spine * 2, neck[1] / 2 + perpUp[1] * p.spine * 2];

  const front = view === 'front';
  const hipL: P = front ? [-4, 0] : hip;
  const hipR: P = front ? [4, 0] : hip;
  const shL: P = front ? [sh[0] - right[0] * 7, sh[1] - right[1] * 7] : sh;
  const shR: P = front ? [sh[0] + right[0] * 7, sh[1] + right[1] * 7] : sh;

  const leg = (h: P, th: number, sn: number, ft: number) => {
    const knee = limb(h, th, LEN.thigh);
    const ankle = limb(knee, sn, LEN.shin);
    const toe = limb(ankle, ft, front ? 4 : LEN.foot);
    return [h, knee, ankle, toe] as P[];
  };
  const arm = (s: P, up: number, fo: number) => {
    const elbow = limb(s, up, LEN.upper);
    return [s, elbow, limb(elbow, fo, LEN.fore)] as P[];
  };

  const lLeg = leg(hipL, p.lThigh, p.lShin, p.lFoot);
  const rLeg = leg(hipR, p.rThigh, p.rShin, p.rFoot);
  const lArm = arm(shL, p.lUpper, p.lFore);
  const rArm = arm(shR, p.rUpper, p.rFore);

  const all = [...lLeg, ...rLeg, ...lArm, ...rArm, neck, hip];
  const maxY = Math.max(...all.map((q) => q[1]), head[1] + LEN.head);
  const dx = p.x;
  const dy = GROUND - maxY;
  const tr = (q: P): P => [q[0] + dx, q[1] + dy];
  return {
    hip: tr(hip), neck: tr(neck), head: tr(head), ctrl: tr(ctrl),
    hipL: tr(hipL), hipR: tr(hipR), shL: tr(shL), shR: tr(shR),
    lLeg: lLeg.map(tr), rLeg: rLeg.map(tr), lArm: lArm.map(tr), rArm: rArm.map(tr),
  };
}

const path = (pts: P[]) => 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L');

export function Figure({ pose, view, wall, size = 160 }: { pose: Required<Pose>; view: 'side' | 'front'; wall?: number; size?: number }) {
  const g = geometry(pose, view);
  const far = view === 'side' ? 'fig-far' : 'fig';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="figure" aria-hidden="true">
      <line x1="4" y1={GROUND + 1.5} x2="96" y2={GROUND + 1.5} className="fig-ground" />
      {wall !== undefined && <line x1={wall} y1="18" x2={wall} y2={GROUND + 1.5} className="fig-ground" />}
      <path d={path(g.lArm)} className={far} />
      <path d={path(g.lLeg)} className={far} />
      {view === 'front' && <path d={path([g.hipL, g.hipR])} className="fig" />}
      {view === 'front' && <path d={path([g.shL, g.shR])} className="fig" />}
      <path
        d={`M${g.hip[0].toFixed(1)} ${g.hip[1].toFixed(1)} Q${g.ctrl[0].toFixed(1)} ${g.ctrl[1].toFixed(1)} ${g.neck[0].toFixed(1)} ${g.neck[1].toFixed(1)}`}
        className="fig"
      />
      <circle cx={g.head[0]} cy={g.head[1]} r={LEN.head} className="fig-head" />
      <path d={path(g.rLeg)} className="fig" />
      <path d={path(g.rArm)} className="fig" />
    </svg>
  );
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Animierte Strichfigur, die zwischen den beiden Posen einer Übung pendelt. */
export function ExerciseFigure({ exercise, size = 160, animate = true }: { exercise: Exercise; size?: number; animate?: boolean }) {
  const a = fill(exercise.poses[0], exercise.view);
  const b = fill(exercise.poses[1], exercise.view);
  const [t, setT] = useState(0);
  const raf = useRef(0);
  const run = animate && !reducedMotion();

  useEffect(() => {
    if (!run) return;
    const period = exercise.category === 'stretch' ? 4000 : 1800;
    const t0 = performance.now();
    const tick = (now: number) => {
      const ph = ((now - t0) % period) / period;
      // weiche Bewegung mit kurzer Pause an den Endpunkten
      const s = Math.min(1, Math.max(0, (0.5 - 0.5 * Math.cos(ph * 2 * Math.PI) - 0.08) / 0.84));
      setT(s);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [run, exercise.id, exercise.category]);

  if (!run) {
    return (
      <div className="figure-pair">
        <Figure pose={a} view={exercise.view} wall={exercise.wall} size={size * 0.7} />
        <span className="figure-arrow">⇄</span>
        <Figure pose={b} view={exercise.view} wall={exercise.wall} size={size * 0.7} />
      </div>
    );
  }
  return <Figure pose={lerpPose(a, b, t)} view={exercise.view} wall={exercise.wall} size={size} />;
}

/** Beide Schlüsselpositionen nebeneinander (statisch). */
export function KeyPoses({ exercise, size = 110 }: { exercise: Exercise; size?: number }) {
  return (
    <div className="figure-pair">
      <figure>
        <Figure pose={fill(exercise.poses[0], exercise.view)} view={exercise.view} wall={exercise.wall} size={size} />
        <figcaption>Position 1</figcaption>
      </figure>
      <span className="figure-arrow">⇄</span>
      <figure>
        <Figure pose={fill(exercise.poses[1], exercise.view)} view={exercise.view} wall={exercise.wall} size={size} />
        <figcaption>Position 2</figcaption>
      </figure>
    </div>
  );
}
