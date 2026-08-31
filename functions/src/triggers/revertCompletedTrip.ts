/** Undo an accidental planned-trip completion (2026-08 Planner rework). */
import * as functions from 'firebase-functions/v1';
import { FirestoreRevertCompletedTripStore } from '../adapters/revertCompletedTripAdapter';
import { revertCompletedTrip as revertLib } from '../lib/revertCompletedTrip';

interface RevertCompletedTripRequest {
  plannedTripId: string;
}

export const revertCompletedTrip = functions.https.onCall(
  async (data: RevertCompletedTripRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    const store = new FirestoreRevertCompletedTripStore();
    const plan = await store.getPlannedTrip(data.plannedTripId);
    if (plan.ownerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not the owner of this planned trip.');
    }

    try {
      return await revertLib(store, data.plannedTripId);
    } catch (err) {
      throw new functions.https.HttpsError('failed-precondition', (err as Error).message);
    }
  },
);
