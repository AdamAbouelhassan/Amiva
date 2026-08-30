/**
 * Backs the `getFeed` callable — the Discover rebuild's friends-first feed
 * with a non-friend high-match fallback (technical_specification.md §4.3's
 * 4-tier algorithm), organized into sections by the viewer's top
 * travel-style categories (packages/core's sectionByTopCategories).
 *
 * Why this is a Cloud Function and not a client-side Firestore query (the
 * way it was originally scaffolded): Feed needs to read across many other
 * users' experiences, and firestore.rules gates `experiences` reads by the
 * owner's privacySetting via a get() on a *different* document — Firestore
 * can't prove a collection query's results would all pass that rule (the
 * same limitation CLAUDE.md's `usernames` lookup-collection gotcha
 * describes), so any such query gets rejected outright once any candidate
 * owner isn't public. Running under the Admin SDK bypasses rules entirely,
 * which means this function is the actual enforcement point for feed
 * visibility — every candidate is checked against lib/visibility.ts's
 * isVisibleTo (the same rule canReadOwnedBy encodes in firestore.rules)
 * before it's scored or returned.
 */
import { defaultMatchScorer, FeedSection, feedComparator, MatchScorer, sectionByTopCategories, TravelStyleVector } from '@amiva/core';
import { FriendStore, UserStore, VisibilityStore } from './ports';
import { isVisibleTo } from './visibility';

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
  /** A broader recent pool spanning any owner, for the non-friend
   * fallback tier (tier 2 of technical_specification.md §4.3). */
  listRecent(limit: number): Promise<FeedCandidate[]>;
}

export interface FeedFilter {
  text?: string;
  country?: string;
  city?: string;
}

export interface FeedResultItem {
  experienceId: string;
  isFriend: boolean;
  matchScore: number;
  createdAt: Date;
  categoryScores: TravelStyleVector;
}

function matchesFilter(candidate: FeedCandidate, filter: FeedFilter): boolean {
  const text = filter.text?.trim().toLowerCase();
  const country = filter.country?.trim().toLowerCase();
  const city = filter.city?.trim().toLowerCase();
  if (text && !candidate.title.toLowerCase().includes(text)) return false;
  if (country && candidate.country.toLowerCase() !== country) return false;
  if (city && candidate.city.toLowerCase() !== city) return false;
  return true;
}

export async function getFeed(
  stores: { feedStore: FeedStore; friendStore: FriendStore; userStore: UserStore; visibilityStore: VisibilityStore },
  viewerId: string,
  filter: FeedFilter = {},
  limit = 60,
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<FeedSection<FeedResultItem>[]> {
  const [friendIds, { travelStyle: viewerVector }] = await Promise.all([
    stores.friendStore.getFriendIdsOf(viewerId),
    stores.userStore.getUserStyle(viewerId),
  ]);
  const friendIdSet = new Set(friendIds);

  const [friendCandidatesRaw, fallbackCandidatesRaw] = await Promise.all([
    friendIds.length > 0 ? stores.feedStore.listByOwners(friendIds, limit * 3) : Promise.resolve([]),
    stores.feedStore.listRecent(limit * 5),
  ]);

  const ownerIdsToCheck = [...new Set([...friendIds, ...fallbackCandidatesRaw.map((c) => c.ownerId)])];
  const privacyByOwner = await stores.visibilityStore.getPrivacySettings(ownerIdsToCheck);

  const visible = (candidate: FeedCandidate) =>
    candidate.ownerId !== viewerId &&
    matchesFilter(candidate, filter) &&
    isVisibleTo(viewerId, candidate.ownerId, privacyByOwner[candidate.ownerId], friendIdSet);

  const friendCandidates = friendCandidatesRaw.filter(visible);
  // The fallback pool is strictly non-friend content (tier 2) — friends'
  // own experiences are already covered above via listByOwners, so this
  // avoids double-counting a friend's post that also happens to be recent
  // enough to land in the broader pool.
  const fallbackCandidates = fallbackCandidatesRaw.filter((c) => !friendIdSet.has(c.ownerId)).filter(visible);

  const scored: FeedResultItem[] = [...friendCandidates, ...fallbackCandidates].map((candidate) => ({
    experienceId: candidate.experienceId,
    categoryScores: candidate.categoryScores,
    isFriend: friendIdSet.has(candidate.ownerId),
    matchScore: matchScorer.score(viewerVector, candidate.categoryScores),
    createdAt: candidate.createdAt,
  }));

  return sectionByTopCategories(scored, viewerVector, { sort: feedComparator() }).map((section) => ({
    category: section.category,
    items: section.items.slice(0, limit),
  }));
}
