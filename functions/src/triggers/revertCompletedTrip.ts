/** Remove your own copy of a shared planned trip from your Logbook (2026-09
 * shared-trip rework — any participant can remove their own copy; the plan
 * only reverts to "planning" once the last copy is gone). */
import * as functions from 'firebase-functions/v1';
import { FirestoreRevertCompletedTripStore } from '../adapters/revertCompletedTripAdapter';
import { removePlannedTripFromLogbook } from '../lib/revertCompletedTrip';

interface RevertCompletedTripRequest {
  plannedTripId: string;
}

export const revertCompletedTrip = functions.https.onCall(
  async (data: RevertCompletedTripRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!data?.plannedTripId) {
      throw new functions.https.HttpsError('invalid-argument', 'plannedTripId is required.');
    }

    try {
      return await removePlannedTripFromLogbook(
        new FirestoreRevertCompletedTripStore(),
        data.plannedTripId,
        context.auth.uid,
      );
    } catch (err) {
      throw new functions.https.HttpsError('failed-precondition', (err as Error).message);
    }
  },
);
