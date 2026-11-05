const arabicNumberFormatter = new Intl.NumberFormat('ar-EG', {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formats a number using Arabic-Indic digits, e.g. 6236 → ٦٬٢٣٦. */
export function formatNumber(value: number): string {
  return arabicNumberFormatter.format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

/** Removes Arabic diacritics and normalizes letter variants for tolerant search. */
export function normalizeArabic(value: string): string {
  return value
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function formatPageRange(from: number, to: number): string {
  return `${formatNumber(from)}–${formatNumber(to)}`;
}
