/**
 * Shared "recent experiences across many owners" candidate shape + port,
 * used by the Friends activity feed (lib/friendsActivity.ts) and the group
 * recommendation candidate pool (lib/groupRecommendationCandidates.ts).
 *
 * It's a Cloud-Function-only read: firestore.rules gates `experiences`
 * reads by the owner's `privacySetting` via a get() on a *different*
 * document, which Firestore can't prove a collection query's results would
 * all satisfy (the `usernames` lookup-collection gotcha in CLAUDE.md) — so
 * any client query spanning many owners is rejected the moment one isn't
 * public. Running under the Admin SDK, callers re-apply that privacy
 * cascade themselves via lib/visibility.ts's `isVisibleTo`.
 *
 * (The old matched-experience "Feed" tab that also lived here was retired
 * when Discovery's Feed tab became a friend-activity feed.)
 */
import { TravelStyleVector } from '@amiva/core';

export interface FeedCandidate {
  experienceId: string;
  ownerId: string;
  title: string;
  city: string;
  country: string;
  categoryScores: TravelStyleVector;
  createdAt: Date;
}

export interface FeedStore {
  /** Every experience belonging to any of these owners, most recent
   * first. Firestore's `in` operator caps at 30 values — FirestoreFeedStore
   * batches internally, callers don't need to. */
  listByOwners(ownerIds: string[], limit: number): Promise<FeedCandidate[]>;
  /** A broader recent pool spanning any owner. */
  listRecent(limit: number): Promise<FeedCandidate[]>;
}
