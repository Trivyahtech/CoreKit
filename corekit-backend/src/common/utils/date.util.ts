/**
 * Format a date to ISO string (date only: YYYY-MM-DD).
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date to a human-readable string.
 */
export function toReadableDate(date: Date, locale: string = 'en-IN'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if a date is in the past.
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future.
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}
