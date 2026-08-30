/** Discover rebuild (2026-08-30): friends-first feed with a non-friend
 * high-match fallback, sectioned by the viewer's top travel-style
 * categories. See lib/feed.ts's header for why this moved server-side —
 * the Admin SDK is the only way to correctly enforce experience-read
 * privacy across many owners at once (firestore.rules can't gate a
 * collection query the way it gates a single-doc read). */
import * as functions from 'firebase-functions/v1';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreFriendStore } from '../adapters/friendAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { getFeed as getFeedLib, FeedFilter } from '../lib/feed';

type FeedRequest = {
  filter?: FeedFilter;
  limit?: number;
};

export const getFeed = functions.https.onCall(async (data: FeedRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to view your Feed.');
  }

  const experienceStore = new FirestoreExperienceStore();
  const userStore = new FirestoreUserStore();

  return getFeedLib(
    { feedStore: experienceStore, friendStore: new FirestoreFriendStore(), userStore, visibilityStore: userStore },
    // viewerId is always the calling user's own uid — never trust a
    // client-supplied id here, or one user could read another user's feed.
    context.auth.uid,
    data.filter ?? {},
    data.limit,
  );
});
