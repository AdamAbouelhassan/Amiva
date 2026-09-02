/** The Planner completion flow (functional_specification.md §4.3; 2026-09
 * shared-trip rework: completion is per participant — each participant
 * calls this to get their OWN Logbook trip mirroring the plan, with their
 * OWN photos). Keeps its deployed name so its IAM invoker binding is
 * untouched. */
import * as functions from 'firebase-functions/v1';
import { FirestorePlannedTripConversionStore } from '../adapters/plannedTripAdapter';
import { addPlannedTripToLogbook } from '../lib/plannedTripConversion';

interface ConvertPlannedTripRequest {
  plannedTripId: string;
  photoUrls?: string[];
}

export const convertPlannedTripToLogbook = functions.https.onCall(
  async (data: ConvertPlannedTripRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!data?.plannedTripId) {
      throw new functions.https.HttpsError('invalid-argument', 'plannedTripId is required.');
    }

    try {
      return await addPlannedTripToLogbook(
        new FirestorePlannedTripConversionStore(),
        data.plannedTripId,
        context.auth.uid,
        data.photoUrls ?? [],
        new Date(),
      );
    } catch (err) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        err instanceof Error ? err.message : 'Could not add trip to your Logbook.',
      );
    }
  },
);
