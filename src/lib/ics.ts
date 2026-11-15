import { addDays } from './date';
import { estMinutes, sessionTitle, summary, TYPE_INFO } from './session';
import type { AppState } from './types';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Zeilen nach RFC 5545 auf max. 75 Byte falten. */
function fold(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

const stamp = (d: string, time: string) => `${d.replace(/-/g, '')}T${time.replace(':', '')}00`;

function addMinutes(date: string, time: string, min: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + min;
  const days = Math.floor(total / 1440);
  const rest = total % 1440;
  const p = (n: number) => String(n).padStart(2, '0');
  return stamp(addDays(date, days), `${p(Math.floor(rest / 60))}:${p(rest % 60)}`);
}

/** Exportiert alle geplanten Einheiten ab heute als Kalenderdatei. */
export function buildIcs(state: AppState, fromDate: string): string {
  const { reminderTime, reminderMinutes } = state.settings;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Laufplan//Trainingsplan//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lauftraining',
  ];
  for (const w of state.weeks) {
    for (const s of w.sessions) {
      if (s.status !== 'planned' || s.date < fromDate) continue;
      const extra = (s.warmup ? 8 : 0) + (s.cooldown ? 8 : 0);
      const dur = estMinutes(s) + extra;
      const desc = [
        TYPE_INFO[s.type].name + ' – ' + summary(s),
        s.warmup ? 'Vorher: ca. 7 min Einwärmen' : '',
        s.cooldown ? 'Danach: ca. 8 min Dehnen' : '',
        s.optional ? 'Optional' : '',
        TYPE_INFO[s.type].hint,
      ].filter(Boolean).join('\n');
      lines.push(
        'BEGIN:VEVENT',
        `UID:${s.id}@laufplan`,
        `DTSTAMP:${now}`,
        `DTSTART:${stamp(s.date, reminderTime)}`,
        `DTEND:${addMinutes(s.date, reminderTime, dur)}`,
        fold(`SUMMARY:${esc((s.optional ? '(optional) ' : 'Lauf: ') + sessionTitle(s))}`),
        fold(`DESCRIPTION:${esc(desc)}`),
      );
      if (reminderMinutes > 0) {
        lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Training', `TRIGGER:-PT${reminderMinutes}M`, 'END:VALARM');
      }
      lines.push('END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
