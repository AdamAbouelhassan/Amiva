/**
 * Trip/experience categorization rules — functional_specification.md §3.2.
 *
 * Pure logic shared by the mobile TripRepository (validating standalone
 * experiences, recategorizing on date-range edit) so the business rule
 * lives in one place and is unit-testable without Firestore.
 *
 * Rules:
 *  - Same country, different date range = a different, separate trip.
 *  - A standalone experience (no tripId) is allowed only if no existing
 *    trip for that country already covers its date.
 *  - Editing a trip's date range may recategorize experiences into/out of
 *    it based on date, "with no other retroactive effects."
 *
 * Assumption (spec doesn't fully enumerate the recategorization scope): on
 * a date-range edit, we (a) evict experiences currently in this trip whose
 * date now falls outside the new range, back to standalone, and (b) pull
 * in currently-standalone experiences of a matching country whose date now
 * falls inside the new range. We deliberately do NOT poach experiences
 * that belong to a *different* trip — moving an experience between two
 * named trips isn't described anywhere in the spec, and doing it silently
 * would be a bigger retroactive effect than "recategorization" implies.
 */
export interface TripDateRange {
  startDate: Date;
  endDate: Date;
}

export interface TripForCategorization extends TripDateRange {
  tripId: string;
  countries: string[];
}

export interface ExperienceForCategorization {
  experienceId: string;
  country: string;
  date: Date;
  tripId?: string;
}

export function isDateWithinRange(date: Date, range: TripDateRange): boolean {
  return date.getTime() >= range.startDate.getTime() && date.getTime() <= range.endDate.getTime();
}

export function rangesOverlap(a: TripDateRange, b: TripDateRange): boolean {
  return a.startDate.getTime() <= b.endDate.getTime() && b.startDate.getTime() <= a.endDate.getTime();
}

/** Returns the existing trip (if any) that a new experience for `country`
 * on `date` must belong to. If this returns a trip, the experience cannot
 * be created as standalone. */
export function findOwningTrip(
  country: string,
  date: Date,
  existingTrips: TripForCategorization[],
): TripForCategorization | undefined {
  return existingTrips.find(
    (trip) => trip.countries.includes(country) && isDateWithinRange(date, trip),
  );
}

export function canExperienceBeStandalone(
  country: string,
  date: Date,
  existingTrips: TripForCategorization[],
): boolean {
  return findOwningTrip(country, date, existingTrips) === undefined;
}

export interface RecategorizationResult {
  /** Experience IDs that should be assigned into this trip. */
  toAdd: string[];
  /** Experience IDs (previously in this trip) that should become standalone. */
  toRemove: string[];
}

/** Computes which experiences should move in/out of a trip after its date
 * range (and/or countries) has been edited. `candidates` should be all
 * experiences either already in this trip, or currently standalone with a
 * matching country — the caller (TripRepository) is responsible for
 * fetching that candidate set from Firestore. */
export function computeTripRecategorization(
  trip: TripForCategorization,
  candidates: ExperienceForCategorization[],
): RecategorizationResult {
  const toAdd: string[] = [];
  const toRemove: string[] = [];

  for (const experience of candidates) {
    const countryMatches = trip.countries.includes(experience.country);
    const dateWithinRange = isDateWithinRange(experience.date, trip);
    const belongsToThisTrip = experience.tripId === trip.tripId;

    if (belongsToThisTrip && !dateWithinRange) {
      toRemove.push(experience.experienceId);
    } else if (!belongsToThisTrip && !experience.tripId && countryMatches && dateWithinRange) {
      toAdd.push(experience.experienceId);
    }
  }

  return { toAdd, toRemove };
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

/** Auto-generates a trip name from country + date range, e.g.
 * "Japan — Jan 1–10" (functional_specification.md §3.2). Editable after
 * generation; this is only the initial default. */
export function generateTripName(countries: string[], range: TripDateRange): string {
  const country = countries[0] ?? 'Trip';
  const suffix = countries.length > 1 ? ` +${countries.length - 1}` : '';
  // Use UTC components throughout: trip dates are day-granularity (Firestore
  // Timestamps at midnight UTC in practice), and formatting in the device's
  // local timezone could shift a midnight-UTC date to the previous/next
  // calendar day depending on where the user is.
  const sameMonth =
    range.startDate.getUTCMonth() === range.endDate.getUTCMonth() &&
    range.startDate.getUTCFullYear() === range.endDate.getUTCFullYear();
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
  const startLabel = `${monthFormatter.format(range.startDate)} ${range.startDate.getUTCDate()}`;
  const endLabel = sameMonth
    ? `${range.endDate.getUTCDate()}`
    : `${monthFormatter.format(range.endDate)} ${range.endDate.getUTCDate()}`;
  return `${country}${suffix} — ${startLabel}–${endLabel}`;
}
