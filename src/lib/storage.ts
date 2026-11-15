import type { AppState } from './types';

const KEY = 'laufplan-state-v1';

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AppState;
    return s && s.version === 1 && Array.isArray(s.weeks) ? s : null;
  } catch {
    return null;
  }
}

export function saveState(s: AppState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* Speicher voll oder blockiert – App funktioniert trotzdem in dieser Sitzung */
  }
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen. */
export function requestPersistence() {
  try {
    navigator.storage?.persist?.();
  } catch {
    /* egal */
  }
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function parseBackup(text: string): AppState {
  const s = JSON.parse(text) as AppState;
  if (!s || s.version !== 1 || !Array.isArray(s.weeks) || !s.settings) {
    throw new Error('Das ist keine gültige Laufplan-Sicherung.');
  }
  return s;
}
