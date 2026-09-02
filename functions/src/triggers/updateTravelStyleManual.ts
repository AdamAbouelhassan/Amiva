/** See lib/manualStyleEdit.ts for why this callable exists even though
 * it isn't named in technical_specification.md §5's table. */
import * as functions from 'firebase-functions/v1';
import { coerceTravelStyleVector, TravelStyleVector } from '@amiva/core';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { updateTravelStyleManual as updateManualLib } from '../lib/manualStyleEdit';

interface UpdateTravelStyleManualRequest {
  travelStyle: TravelStyleVector;
}

export const updateTravelStyleManual = functions.https.onCall(
  async (data: UpdateTravelStyleManualRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    // Defensive, not just for old Firestore data this time — a stale
    // client build (cached old JS bundle) could still submit an
    // old-shaped payload here; never trust client input at face value.
    await updateManualLib(new FirestoreUserStore(), context.auth.uid, coerceTravelStyleVector(data.travelStyle), new Date());
    return { success: true };
  },
);
