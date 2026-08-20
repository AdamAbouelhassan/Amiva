/**
 * technical_specification.md §5: "Recompute cached compatibility scores
 * for all of that user's friend edges." Fires on any change to
 * `travelStyle`, whether from automatic decay (onExperienceCreated /
 * onSaveCreated) or a manual edit (updateTravelStyleManual) — both write
 * through FirestoreUserStore, so both land here identically.
 */
import * as functions from 'firebase-functions';
import isEqual from '../lib/isEqual';
import { FirestoreFriendStore } from '../adapters/friendAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { recomputeCompatibilityForAllFriends } from '../lib/friendCompatibility';
import { FriendStore, UserStore } from '../lib/ports';

export const onTravelStyleChanged = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (isEqual(before.travelStyle, after.travelStyle)) return; // no-op: avoid needless recompute fan-out

    const userStore = new FirestoreUserStore();
    const friendStore = new FirestoreFriendStore();
    const store: UserStore & FriendStore = {
      getUserStyle: userStore.getUserStyle.bind(userStore),
      saveAutomaticStyleUpdate: userStore.saveAutomaticStyleUpdate.bind(userStore),
      saveManualStyleEdit: userStore.saveManualStyleEdit.bind(userStore),
      createFriendEdgePair: friendStore.createFriendEdgePair.bind(friendStore),
      getFriendIdsOf: friendStore.getFriendIdsOf.bind(friendStore),
      updateCompatibilityScore: friendStore.updateCompatibilityScore.bind(friendStore),
    };

    await recomputeCompatibilityForAllFriends(store, context.params.userId);
  });
