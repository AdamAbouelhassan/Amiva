/** The Planner completion flow (functional_specification.md §4.3) — 2026-08
 * rework: takes the photos the user just added, creates one Logbook trip
 * mirroring the plan, and links them. */
import * as functions from 'firebase-functions/v1';
import { FirestorePlannedTripConversionStore } from '../adapters/plannedTripAdapter';
import { convertPlannedTripToLogbook as convertLib } from '../lib/plannedTripConversion';

interface ConvertPlannedTripRequest {
  plannedTripId: string;
  photoUrls?: string[];
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

    return convertLib(store, data.plannedTripId, data.photoUrls ?? []);
  },
);
