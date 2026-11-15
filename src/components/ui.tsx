import { useEffect, type ReactNode } from 'react';
import type { Session } from '../lib/types';
import { sessionTitle, summary, TYPE_INFO } from '../lib/session';
import { WEEKDAYS_SHORT, shortDate, weekday } from '../lib/date';

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          {title && <h2>{title}</h2>}
          <button className="icon-btn" onClick={onClose} aria-label="Schliessen">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function StatusMark({ s }: { s: Session }) {
  if (s.status === 'done') return <span className="status done" title="Erledigt">✓</span>;
  if (s.status === 'skipped') return <span className="status skipped" title="Ausgelassen">–</span>;
  return <span className="status planned" />;
}

export function SessionCard({ s, onClick, showDate = false, today }: { s: Session; onClick?: () => void; showDate?: boolean; today?: string }) {
  const info = TYPE_INFO[s.type];
  const overdue = today && s.status === 'planned' && s.date < today;
  return (
    <button className={`session-card st-${s.status}${overdue ? ' overdue' : ''}`} onClick={onClick} style={{ ['--type' as string]: info.color }}>
      <span className="session-bar" />
      <span className="session-main">
        <span className="session-kicker">
          {showDate && <>{WEEKDAYS_SHORT[weekday(s.date)]}, {shortDate(s.date)} · </>}
          {info.short}
          {s.optional && ' · optional'}
        </span>
        <span className="session-title">{sessionTitle(s)}</span>
        <span className="session-sub">
          {summary(s)}
          {s.warmup || s.cooldown ? ' + Einwärmen & Dehnen' : ''}
        </span>
      </span>
      <StatusMark s={s} />
    </button>
  );
}

const ICONS: Record<string, ReactNode> = {
  today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  week: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  plan: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  exercises: <><circle cx="13" cy="4.5" r="2" /><path d="M12 8l-3 5 4 3-1 6M9 13l-4 1M12 8l4 3 3-1" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  play: <path d="M7 4v16l13-8z" fill="currentColor" />,
  pause: <path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor" />,
  next: <path d="M5 4v16l10-8zM17 4h2v16h-2z" fill="currentColor" />,
  prev: <path d="M19 4v16L9 12zM5 4h2v16H5z" fill="currentColor" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function NumberField({ label, value, onChange, step = 1, min = 0, suffix }: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void; step?: number; min?: number; suffix?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')))}
        />
        {suffix && <em>{suffix}</em>}
      </span>
    </label>
  );
}
