/**
 * Backs `onFriendAdded` and `onTravelStyleChanged`
 * (technical_specification.md §5).
 *
 * Friend adds are direct — no invite/accept step
 * (functional_specification.md §6.3) — so `addFriend` both creates the
 * bidirectional edge and fires the notification in one step, rather than
 * a separate "request accepted" flow.
 *
 * Assumption: the spec doesn't say which party gets notified on a direct
 * add. We notify the *other* party (not whoever initiated the add) — the
 * initiator already knows they just added someone (e.g. by scanning a QR
 * code or accepting a contacts-sync suggestion); the other party is the
 * one finding out about a new connection.
 */
import { defaultMatchScorer, MatchScorer } from '@amiva/core';
import { FriendStore, NotificationStore, UserStore } from './ports';

export interface AddFriendInput {
  initiatorId: string;
  friendId: string;
  addedVia: 'contacts_sync' | 'qr_link';
  now: Date;
  matchScorer?: MatchScorer;
}

export interface AddFriendResult {
  compatibilityScore: number;
}

export async function addFriend(
  store: UserStore & FriendStore & NotificationStore,
  input: AddFriendInput,
): Promise<AddFriendResult> {
  const scorer = input.matchScorer ?? defaultMatchScorer;

  const [initiator, friend] = await Promise.all([
    store.getUserStyle(input.initiatorId),
    store.getUserStyle(input.friendId),
  ]);

  const compatibilityScore = scorer.score(initiator.travelStyle, friend.travelStyle);

  await store.createFriendEdgePair({
    userId: input.initiatorId,
    friendId: input.friendId,
    compatibilityScore,
    addedVia: input.addedVia,
    createdAt: input.now,
  });

  await store.createNotification({
    recipientId: input.friendId,
    type: 'friend_added',
    payload: { friendId: input.initiatorId },
    createdAt: input.now,
  });

  return { compatibilityScore };
}

/** On any change to a user's travelStyle (automatic or manual), the cached
 * compatibilityScore on every one of their friend edges is stale and must
 * be recomputed — both directions of each edge pair, since both copies
 * cache the same score (technical_specification.md §3.7). */
export async function recomputeCompatibilityForAllFriends(
  store: UserStore & FriendStore,
  userId: string,
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<void> {
  const [userStyle, friendIds] = await Promise.all([
    store.getUserStyle(userId),
    store.getFriendIdsOf(userId),
  ]);

  await Promise.all(
    friendIds.map(async (friendId) => {
      const friendStyle = await store.getUserStyle(friendId);
      const score = matchScorer.score(userStyle.travelStyle, friendStyle.travelStyle);
      await Promise.all([
        store.updateCompatibilityScore(userId, friendId, score),
        store.updateCompatibilityScore(friendId, userId, score),
      ]);
    }),
  );
}
