import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { today as realToday } from './lib/date';
import { loadState, requestPersistence, saveState } from './lib/storage';
import type { AppState, Session } from './lib/types';

interface Store {
  state: AppState | null;
  today: string;
  replace: (s: AppState | null) => void;
  update: (fn: (draft: AppState) => void) => void;
}

const Ctx = createContext<Store | null>(null);

/** Für Tests/Demo: ?heute=2027-03-01 simuliert ein anderes Datum. */
function currentDay(): string {
  const q = new URLSearchParams(location.search).get('heute');
  return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : realToday();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(() => loadState());
  const [today, setToday] = useState(currentDay);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    requestPersistence();
    const onVis = () => document.visibilityState === 'visible' && setToday(currentDay());
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const replace = useCallback((s: AppState | null) => setState(s), []);
  const update = useCallback((fn: (d: AppState) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const value = useMemo(() => ({ state, today, replace, update }), [state, today, replace, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider fehlt');
  return s;
}

export function findSession(state: AppState, id: string): { wi: number; si: number; session: Session } | null {
  for (let wi = 0; wi < state.weeks.length; wi++) {
    const si = state.weeks[wi].sessions.findIndex((s) => s.id === id);
    if (si !== -1) return { wi, si, session: state.weeks[wi].sessions[si] };
  }
  return null;
}
