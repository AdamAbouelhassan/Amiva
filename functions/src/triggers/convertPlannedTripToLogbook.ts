/** technical_specification.md §5: "Triggered on trip completion flow;
 * creates Experience docs from PlannedTripItems per user confirmation." */
import * as functions from 'firebase-functions/v1';
import { FirestorePlannedTripConversionStore } from '../adapters/plannedTripAdapter';
import { ConversionDecision, convertPlannedTripToLogbook as convertLib } from '../lib/plannedTripConversion';

interface ConvertPlannedTripRequest {
  plannedTripId: string;
  decisions: ConversionDecision[];
}

export const convertPlannedTripToLogbook = functions.https.onCall(
  async (data: ConvertPlannedTripRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }

    const store = new FirestorePlannedTripConversionStore();
    const plannedTrip = await store.getPlannedTrip(data.plannedTripId);
    if (plannedTrip.ownerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not the owner of this planned trip.');
    }

    return convertLib(store, data.plannedTripId, data.decisions);
  },
);
