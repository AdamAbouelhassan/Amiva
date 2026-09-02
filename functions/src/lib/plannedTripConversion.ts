/**
 * Backs the `convertPlannedTripToLogbook` callable — the Planner's
 * completion flow (functional_specification.md §4.3).
 *
 * 2026-09 shared-trip rework: a planned trip can have collaborators, and
 * completion is now **per participant**. After the trip's end date, each
 * participant (owner + every collaborator) independently calls this to get
 * their **own** Logbook `Trip` mirroring the plan, with their **own**
 * photos; they then log their own experiences into it via "Log this" on the
 * itinerary. The plan records every copy in `loggedTripIds: { [uid]: tripId }`.
 * This extends §4.3's single conversion — tracked in CLAUDE.md.
 */
import { generateTripName } from '@amiva/core';
import { PrivacySetting } from './visibility';

export interface PlannedTripRecord {
  plannedTripId: string;
  ownerId: string;
  collaboratorIds: string[];
  name: string;
  location: string;
  country: string;
  city?: string;
  notes?: string;
  accommodation?: string;
  startDate: Date;
  endDate: Date;
  visibility: PrivacySetting;
  loggedTripIds: Record<string, string>;
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
  /** Creates the Logbook trip owned by `userId`; returns its id. */
  createTripForUser(userId: string, input: CreateLogbookTripInput): Promise<string>;
  /** Records `loggedTripIds[userId] = tripId`; when `markCompleted` is true
   * (the first participant to log) also sets `status: 'completed'` +
   * `completedAt`. */
  recordLoggedTrip(
    plannedTripId: string,
    userId: string,
    tripId: string,
    markCompleted: boolean,
  ): Promise<void>;
}

export async function addPlannedTripToLogbook(
  store: PlannedTripConversionStore,
  plannedTripId: string,
  userId: string,
  photoUrls: string[],
  now: Date,
): Promise<{ tripId: string }> {
  const plan = await store.getPlannedTrip(plannedTripId);

  const isParticipant = plan.ownerId === userId || plan.collaboratorIds.includes(userId);
  if (!isParticipant) {
    throw new Error('Only someone on this trip can add it to their Logbook.');
  }

  const existing = plan.loggedTripIds[userId];
  if (existing) return { tripId: existing }; // idempotent

  if (plan.endDate.getTime() > now.getTime()) {
    throw new Error('This trip hasn’t ended yet.');
  }

  const tripId = await store.createTripForUser(userId, {
    name:
      plan.name.trim() ||
      generateTripName(plan.location, { startDate: plan.startDate, endDate: plan.endDate }),
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

  const isFirst = Object.keys(plan.loggedTripIds).length === 0;
  await store.recordLoggedTrip(plannedTripId, userId, tripId, isFirst);
  return { tripId };
}
