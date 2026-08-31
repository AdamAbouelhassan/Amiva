/** Discovery "Friends" tab — a chronological feed of friends' activity
 * (logged experiences/trips, saves, completed planned trips, new
 * connections). See lib/friendsActivity.ts's header for why this runs
 * server-side (privacy enforcement across many owners). */
import * as functions from 'firebase-functions/v1';
import { FirestoreFriendActivityStore } from '../adapters/friendActivityAdapter';
import { getFriendsActivity as getFriendsActivityLib } from '../lib/friendsActivity';

type FriendsActivityRequest = { limit?: number };

export const getFriendsActivity = functions.https.onCall(async (data: FriendsActivityRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to view your Friends feed.');
  }
  return getFriendsActivityLib(
    new FirestoreFriendActivityStore(),
    // viewerId is always the caller's own uid — never trust a client id.
    context.auth.uid,
    data.limit,
  );
});
