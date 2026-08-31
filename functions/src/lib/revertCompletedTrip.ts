/**
 * Undo an accidental planned-trip completion (2026-08 Planner rework).
 * Deletes the Logbook trip that completion created and restores the plan to
 * a pre-completion state. Any experiences the user logged into that trip
 * after completing are **detached** (tripId → null), never deleted.
 */
export interface RevertPlannedTripRecord {
  plannedTripId: string;
  ownerId: string;
  status: string;
  convertedToTripId?: string;
}

export interface RevertCompletedTripStore {
  getPlannedTrip(plannedTripId: string): Promise<RevertPlannedTripRecord>;
  detachExperiences(tripId: string): Promise<number>;
  deleteTrip(tripId: string): Promise<void>;
  restorePlannedTrip(plannedTripId: string): Promise<void>;
}

export async function revertCompletedTrip(
  store: RevertCompletedTripStore,
  plannedTripId: string,
): Promise<{ detachedExperiences: number }> {
  const plan = await store.getPlannedTrip(plannedTripId);
  if (plan.status !== 'completed') {
    throw new Error('Planned trip is not completed.');
  }

  let detachedExperiences = 0;
  if (plan.convertedToTripId) {
    detachedExperiences = await store.detachExperiences(plan.convertedToTripId);
    await store.deleteTrip(plan.convertedToTripId);
  }

  await store.restorePlannedTrip(plannedTripId);
  return { detachedExperiences };
}
