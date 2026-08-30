/**
 * technical_specification.md §5: "Compute and cache compatibility score
 * both directions; fire friend_added notification."
 *
 * Implemented as a callable (not a Firestore trigger reacting to a
 * client-written edge doc) because friend edges cache a server-computed
 * `compatibilityScore` and technical_specification.md §6 reserves
 * computed/server-only fields for Cloud-Function writes — the client
 * can't write a valid friends/ doc itself. Direct-add, no invite/accept
 * step (functional_specification.md §6.3), so this single call both
 * creates the edge and fires the notification.
 */
import * as functions from 'firebase-functions/v1';
import { FirestoreFriendStore } from '../adapters/friendAdapter';
import { FirestoreNotificationStore } from '../adapters/notificationAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { addFriend } from '../lib/friendCompatibility';
import { FriendStore, NotificationStore, UserStore } from '../lib/ports';

interface AddFriendRequest {
  friendId: string;
  addedVia: 'contacts_sync' | 'qr_link';
}

export const onFriendAdded = functions.https.onCall(async (data: AddFriendRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to add a friend.');
  }
  if (!data.friendId || data.friendId === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid, distinct friendId is required.');
  }

  const userStore = new FirestoreUserStore();
  const friendStore = new FirestoreFriendStore();
  const notificationStore = new FirestoreNotificationStore();
  const store: UserStore & FriendStore & NotificationStore = {
    getUserStyle: userStore.getUserStyle.bind(userStore),
    saveAutomaticStyleUpdate: userStore.saveAutomaticStyleUpdate.bind(userStore),
    saveManualStyleEdit: userStore.saveManualStyleEdit.bind(userStore),
    createFriendEdgePair: friendStore.createFriendEdgePair.bind(friendStore),
    getFriendIdsOf: friendStore.getFriendIdsOf.bind(friendStore),
    updateCompatibilityScore: friendStore.updateCompatibilityScore.bind(friendStore),
    createNotification: notificationStore.createNotification.bind(notificationStore),
  };

  return addFriend(store, {
    initiatorId: context.auth.uid,
    friendId: data.friendId,
    addedVia: data.addedVia,
    now: new Date(),
  });
});
