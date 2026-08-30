/**
 * Backs the `convertPlannedTripToLogbook` callable
 * (technical_specification.md §5), triggered by the Planner's completion
 * flow: "prompts the user to convert the planned items into real Logbook
 * entries... with an option to skip any item" (functional_specification.md
 * §4.3).
 *
 * Assumption: the spec doesn't say whether converted items land in a new
 * or existing Logbook Trip. We create (or reuse, per the standalone/trip
 * business rule) a logbook Trip matching the planned trip's primary
 * location and date range, and attach every converted item to it — this
 * keeps the resulting Logbook entries consistent with the "same country +
 * date range = one trip" rule in functional_specification.md §3.2, rather
 * than dumping converted items in as unrelated standalone experiences.
 * `PlannedTrip.locations` is a flat string[] (technical_specification.md
 * §3.6) with no declared country/city split, so we treat its first entry
 * as the primary country for this purpose.
 */
import { TravelStyleVector } from '@amiva/core';

export interface PlannedTripRecord {
  plannedTripId: string;
  ownerId: string;
  locations: string[];
  startDate: Date;
  endDate: Date;
}

export interface PlannedTripItemRecord {
  itemId: string;
  plannedTripId: string;
  placeId: string;
  title: string;
}

export interface ExperienceDraftInput {
  photoUrls: string[];
  rating: number;
  notes: string;
  categoryScores: TravelStyleVector;
  date: Date;
  dateSource: 'exif' | 'manual';
}

export type ConversionDecision =
  | { itemId: string; action: 'convert'; details: ExperienceDraftInput }
  | { itemId: string; action: 'skip' };

export interface PlannedTripConversionStore {
  getPlannedTrip(plannedTripId: string): Promise<PlannedTripRecord>;
  getPlannedTripItem(itemId: string): Promise<PlannedTripItemRecord>;
  /** Finds an existing logbook Trip covering `country` + the given date
   * range, or creates one (delegates to the same standalone/trip
   * categorization rule as manual logging — see
   * packages/core/tripCategorization.ts). Returns the tripId. */
  findOrCreateTripForCountry(
    ownerId: string,
    country: string,
    range: { startDate: Date; endDate: Date },
  ): Promise<string>;
  createExperience(
    ownerId: string,
    tripId: string | undefined,
    item: PlannedTripItemRecord,
    details: ExperienceDraftInput,
  ): Promise<string>;
  markItemConverted(itemId: string, experienceId: string): Promise<void>;
}

export interface ConversionSummary {
  converted: string[];
  skipped: string[];
}

export async function convertPlannedTripToLogbook(
  store: PlannedTripConversionStore,
  plannedTripId: string,
  decisions: ConversionDecision[],
): Promise<ConversionSummary> {
  const plannedTrip = await store.getPlannedTrip(plannedTripId);
  const primaryCountry = plannedTrip.locations[0];

  const converted: string[] = [];
  const skipped: string[] = [];

  for (const decision of decisions) {
    if (decision.action === 'skip') {
      skipped.push(decision.itemId);
      continue;
    }

    const item = await store.getPlannedTripItem(decision.itemId);
    const tripId = primaryCountry
      ? await store.findOrCreateTripForCountry(plannedTrip.ownerId, primaryCountry, {
          startDate: plannedTrip.startDate,
          endDate: plannedTrip.endDate,
        })
      : undefined;

    const experienceId = await store.createExperience(plannedTrip.ownerId, tripId, item, decision.details);
    await store.markItemConverted(item.itemId, experienceId);
    converted.push(decision.itemId);
  }

  return { converted, skipped };
}
