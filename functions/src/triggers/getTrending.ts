/** technical_specification.md §5 / functional_specification.md §5.4 — the
 * Discovery "Trending" tab: one flat ranked list of the most popular
 * experiences across Amiva. See lib/trending.ts for the scoring and why
 * sign-in is required (privacy enforcement + per-card match %). */
import * as functions from 'firebase-functions/v1';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreFriendStore } from '../adapters/friendAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { getTrending as getTrendingLib } from '../lib/trending';

type TrendingRequest = { limit?: number };

export const getTrending = functions.https.onCall(async (data: TrendingRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to view Trending.');
  }

  const experienceStore = new FirestoreExperienceStore();
  const userStore = new FirestoreUserStore();

  return getTrendingLib(
    { trendingStore: experienceStore, userStore, friendStore: new FirestoreFriendStore(), visibilityStore: userStore },
    // viewerId is always the calling user's own uid — never trust a client id.
    context.auth.uid,
    new Date(),
    data.limit,
  );
});
