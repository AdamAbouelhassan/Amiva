import * as functions from 'firebase-functions/v1';
import { FirestorePlaceStore, PlaceUpsertInput } from '../adapters/placeAdapter';

export const upsertPlace = functions.https.onCall(async (data: PlaceUpsertInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (!data.placeId || !data.name || !data.country || !data.city) {
    throw new functions.https.HttpsError('invalid-argument', 'placeId, name, country, and city are required.');
  }
  // Defensive default — an older/un-updated client build could still send
  // no googlePlaceTypes at all; falling back to [] degrades to the zero
  // vector at scoring time (estimateCategoryScoresFromPlace) rather than
  // rejecting the place entirely.
  await new FirestorePlaceStore().upsertPlace({ ...data, googlePlaceTypes: data.googlePlaceTypes ?? [] }, new Date());
  return { success: true };
});
