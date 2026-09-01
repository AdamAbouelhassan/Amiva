/** A friend's profile — their visible trips, planned trips, and logged
 * experiences. Privacy enforced server-side (see lib/userProfileContent.ts). */
import * as functions from 'firebase-functions/v1';
import { FirestoreUserProfileContentStore } from '../adapters/userProfileContentAdapter';
import { getUserProfileContent as getUserProfileContentLib } from '../lib/userProfileContent';

interface Request {
  targetUserId: string;
}

export const getUserProfileContent = functions.https.onCall(async (data: Request, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (!data?.targetUserId) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId is required.');
  }
  return getUserProfileContentLib(
    new FirestoreUserProfileContentStore(),
    context.auth.uid, // viewerId — never trust a client id
    data.targetUserId,
  );
});
