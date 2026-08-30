/** technical_specification.md §5: global / location-scoped / personalized
 * trending queries (functional_specification.md §5.4). */
import * as functions from 'firebase-functions/v1';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { getTrending as getTrendingLib } from '../lib/trending';

type TrendingRequest =
  | { scope: 'global'; limit?: number }
  | { scope: 'location'; country: string; city?: string; limit?: number }
  | { scope: 'personalized'; limit?: number };

export const getTrending = functions.https.onCall(async (data: TrendingRequest, context) => {
  const experienceStore = new FirestoreExperienceStore();
  const userStore = new FirestoreUserStore();

  if (data.scope === 'personalized') {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Personalized trending requires sign-in.');
    }
    // viewerId is always the calling user's own uid — never trust a
    // client-supplied id here, or one user could read trending ranked for
    // another user's private travel style.
    return getTrendingLib(
      { trendingStore: experienceStore, userStore },
      { type: 'personalized', viewerId: context.auth.uid },
      new Date(),
      data.limit,
    );
  }

  if (data.scope === 'location') {
    return getTrendingLib(
      { trendingStore: experienceStore, userStore },
      { type: 'location', country: data.country, city: data.city },
      new Date(),
      data.limit,
    );
  }

  return getTrendingLib({ trendingStore: experienceStore, userStore }, { type: 'global' }, new Date(), data.limit);
});
