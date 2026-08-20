/** See lib/manualStyleEdit.ts for why this callable exists even though
 * it isn't named in technical_specification.md §5's table. */
import * as functions from 'firebase-functions';
import { TravelStyleVector } from '@amiva/core';
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
    await updateManualLib(new FirestoreUserStore(), context.auth.uid, data.travelStyle, new Date());
    return { success: true };
  },
);
