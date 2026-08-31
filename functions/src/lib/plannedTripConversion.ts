/**
 * Backs the `convertPlannedTripToLogbook` callable — the Planner's
 * completion flow (functional_specification.md §4.3).
 *
 * 2026-08 Planner rework: completion collects **photos only**. It creates
 * one Logbook `Trip` mirroring the planned trip (+ the photos the user just
 * added) and links the plan to it (`convertedToTripId`). Per-item
 * experience conversion (rating/caption/category) is deferred — the user
 * logs experiences into the new trip afterwards via "Log this" on the
 * itinerary. Completion is gated client-side to after the planned end date.
 */
import { generateTripName } from '@amiva/core';
import { PrivacySetting } from './visibility';

export interface PlannedTripRecord {
  plannedTripId: string;
  ownerId: string;
  name: string;
  location: string;
  country: string;
  city?: string;
  notes?: string;
  accommodation?: string;
  startDate: Date;
  endDate: Date;
  visibility: PrivacySetting;
}

export interface CreateLogbookTripInput {
  name: string;
  location: string;
  country: string;
  city?: string;
  notes?: string;
  accommodation?: string;
  startDate: Date;
  endDate: Date;
  visibility: PrivacySetting;
  photoUrls: string[];
}

export interface PlannedTripConversionStore {
  getPlannedTrip(plannedTripId: string): Promise<PlannedTripRecord>;
  /** Creates the Logbook trip; returns its id. */
  createTripForPlannedTrip(ownerId: string, input: CreateLogbookTripInput): Promise<string>;
  markPlannedTripCompleted(plannedTripId: string, tripId: string): Promise<void>;
}

export async function convertPlannedTripToLogbook(
  store: PlannedTripConversionStore,
  plannedTripId: string,
  photoUrls: string[],
): Promise<{ tripId: string }> {
  const plan = await store.getPlannedTrip(plannedTripId);

  const tripId = await store.createTripForPlannedTrip(plan.ownerId, {
    name: plan.name.trim() || generateTripName(plan.location, { startDate: plan.startDate, endDate: plan.endDate }),
    location: plan.location,
    country: plan.country,
    city: plan.city,
    notes: plan.notes,
    accommodation: plan.accommodation,
    startDate: plan.startDate,
    endDate: plan.endDate,
    visibility: plan.visibility,
    photoUrls,
  });

  await store.markPlannedTripCompleted(plannedTripId, tripId);
  return { tripId };
}
