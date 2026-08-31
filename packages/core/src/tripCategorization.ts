/**
 * Trip naming + cover-photo helpers — functional_specification.md §3.
 *
 * Pure logic shared by the mobile TripRepository and the Cloud Functions
 * planned-trip conversion so the business rule lives in one place and is
 * unit-testable without Firestore.
 *
 * NOTE: as of the 2026-08 Trip restructure, a Trip is a plain user-authored
 * container (one location, optional date range, name, notes, accommodation,
 * photos, explicitly-attached experiences). The old "country + date range"
 * identity — auto-categorization of experiences into trips, the
 * standalone-experience rule, and date-range recategorization — has been
 * retired. This intentionally diverges from functional_specification.md §3.2
 * (tracked in CLAUDE.md).
 */
export interface TripDateRange {
  startDate: Date;
  endDate: Date;
}

/** Trip cover photo defaults to the first experience photo, in experience
 * order, unless manually overridden (functional_specification.md §3.2). */
export function deriveDefaultCoverPhoto(
  experiences: Array<{ photoUrls: string[]; date: Date }>,
): string | undefined {
  const sorted = [...experiences].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (const experience of sorted) {
    if (experience.photoUrls.length > 0) return experience.photoUrls[0];
  }
  return undefined;
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

// Trip dates are day-granularity (Firestore Timestamps at midnight UTC in
// practice); format in UTC so a midnight-UTC date doesn't shift a calendar
// day depending on the device's timezone.
function label(date: Date): string {
  return `${MONTH.format(date)} ${date.getUTCDate()}`;
}

/** Auto-generates a trip name from its location + date range, e.g.
 * "Tokyo, Japan — Jan 1–10". Editable after generation; this is only the
 * initial default (functional_specification.md §3.2). */
export function generateTripName(location: string, range: TripDateRange): string {
  const place = location.trim() || 'Trip';
  const { startDate: start, endDate: end } = range;
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  const endLabel = sameMonth ? `${end.getUTCDate()}` : label(end);
  return `${place} — ${label(start)}–${endLabel}`;
}
