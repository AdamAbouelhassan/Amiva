/** technical_specification.md §5: global / location-scoped / personalized
 * trending queries (functional_specification.md §5.4), sectioned by the
 * viewer's top travel-style categories (see lib/trending.ts's header for
 * why every scope now requires sign-in — the same privacy check and
 * section headers both need the viewer's identity/travelStyle, not just
 * the 'personalized' scope). */
import * as functions from 'firebase-functions/v1';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreFriendStore } from '../adapters/friendAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { getTrending as getTrendingLib, TrendingFilter, TrendingScope } from '../lib/trending';

type TrendingRequest = {
  scope: TrendingScope;
  filter?: TrendingFilter;
  limit?: number;
};

export const getTrending = functions.https.onCall(async (data: TrendingRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to view Trending.');
  }

  const experienceStore = new FirestoreExperienceStore();
  const userStore = new FirestoreUserStore();

  return getTrendingLib(
    { trendingStore: experienceStore, userStore, friendStore: new FirestoreFriendStore(), visibilityStore: userStore },
    // viewerId is always the calling user's own uid — never trust a
    // client-supplied id here, or one user could read trending sectioned
    // and privacy-filtered for another user.
    context.auth.uid,
    data.scope,
    data.filter ?? {},
    new Date(),
    data.limit,
  );
});
