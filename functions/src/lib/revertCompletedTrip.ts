/**
 * Undo adding a shared planned trip to your Logbook (2026-09 shared-trip
 * rework — was owner-only "revert completion").
 *
 * Each participant has their own Logbook copy in
 * `plannedTrips.loggedTripIds[uid]`; this removes **only the caller's**
 * copy — deletes that Logbook trip and detaches (never deletes) any
 * experiences they logged into it. The plan drops back to `planning` only
 * once the *last* participant's copy is removed.
 */
export interface RevertPlannedTripRecord {
  plannedTripId: string;
  status: string;
  loggedTripIds: Record<string, string>;
}

export interface RevertCompletedTripStore {
  getPlannedTrip(plannedTripId: string): Promise<RevertPlannedTripRecord>;
  detachExperiences(tripId: string): Promise<number>;
  deleteTrip(tripId: string): Promise<void>;
  /** Removes `loggedTripIds[userId]`; when `restoreToPlanning` (no copies
   * left) also sets `status: 'planning'` and clears `completedAt`. */
  removeLoggedTrip(plannedTripId: string, userId: string, restoreToPlanning: boolean): Promise<void>;
}

export async function removePlannedTripFromLogbook(
  store: RevertCompletedTripStore,
  plannedTripId: string,
  userId: string,
): Promise<{ detachedExperiences: number }> {
  const plan = await store.getPlannedTrip(plannedTripId);

  const tripId = plan.loggedTripIds[userId];
  if (!tripId) {
    throw new Error('You have not added this trip to your Logbook.');
  }

  const detachedExperiences = await store.detachExperiences(tripId);
  await store.deleteTrip(tripId);

  const remaining = Object.keys(plan.loggedTripIds).filter((uid) => uid !== userId);
  await store.removeLoggedTrip(plannedTripId, userId, remaining.length === 0);

  return { detachedExperiences };
}
