// Datums-Helfer. Alle Daten sind lokale Kalendertage im Format YYYY-MM-DD.
// Wochentage: 0 = Montag … 6 = Sonntag.

export function parseDate(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function today(): string {
  return formatDate(new Date());
}

export function addDays(d: string, n: number): string {
  const x = parseDate(d);
  x.setDate(x.getDate() + n);
  return formatDate(x);
}

export function weekday(d: string): number {
  return (parseDate(d).getDay() + 6) % 7;
}

export function mondayOf(d: string): string {
  return addDays(d, -weekday(d));
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const MONTHS_SHORT = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

/** z. B. "16. Nov." */
export function shortDate(d: string): string {
  const x = parseDate(d);
  return `${x.getDate()}. ${MONTHS_SHORT[x.getMonth()]}`;
}

/** z. B. "Mo, 16. Nov. 2026" */
export function longDate(d: string): string {
  const x = parseDate(d);
  return `${WEEKDAYS_SHORT[weekday(d)]}, ${x.getDate()}. ${MONTHS_SHORT[x.getMonth()]} ${x.getFullYear()}`;
}
