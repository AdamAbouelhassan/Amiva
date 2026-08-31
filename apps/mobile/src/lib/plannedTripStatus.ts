import { PlannedTripStatus } from '../repositories/types';

/** A trip flips to "Upcoming" once its start date is this close
 * (functional_specification.md §4.1 — the transition wasn't defined, so we
 * derive it; the user can also set it manually). */
export const UPCOMING_WINDOW_DAYS = 14;

const DAY_MS = 86_400_000;

/** The status to show — `completed` and a manual `upcoming` override are
 * respected; otherwise it's derived from how soon the trip starts. */
export function displayPlannedTripStatus(
  stored: PlannedTripStatus,
  startDate: Date,
  now: Date = new Date(),
): PlannedTripStatus {
  if (stored === 'completed') return 'completed';
  if (stored === 'upcoming') return 'upcoming';
  const daysAway = (startDate.getTime() - now.getTime()) / DAY_MS;
  return daysAway <= UPCOMING_WINDOW_DAYS ? 'upcoming' : 'planning';
}

/** A plan can only be marked completed once its planned end date has
 * passed. */
export function canComplete(endDate: Date, now: Date = new Date()): boolean {
  return now.getTime() > endDate.getTime();
}
