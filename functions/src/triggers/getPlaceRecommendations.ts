/** Recommendations (functional_specification.md §5.2), rebuilt to pull
 * from the Google Places catalog — see lib/placeRecommendations.ts's
 * header for why this runs server-side. */
import * as functions from 'firebase-functions/v1';
import { GooglePlacesApi } from '../adapters/placesApiAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { getPlaceRecommendations as getPlaceRecommendationsLib, PlaceRecommendationFilter } from '../lib/placeRecommendations';

type PlaceRecommendationsRequest = {
  filter: PlaceRecommendationFilter;
  limit?: number;
};

export const getPlaceRecommendations = functions.https.onCall(async (data: PlaceRecommendationsRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to view Recommendations.');
  }
  if (!data.filter?.country) {
    throw new functions.https.HttpsError('invalid-argument', 'filter.country is required.');
  }

  return getPlaceRecommendationsLib(
    { placesSearch: new GooglePlacesApi(), userStore: new FirestoreUserStore() },
    context.auth.uid,
    data.filter,
    data.limit,
  );
});
