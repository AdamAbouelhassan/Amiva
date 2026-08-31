/**
 * Backs the `getTrending` callable (technical_specification.md §5,
 * functional_specification.md §5.4) — the Discovery "Trending" tab: a
 * single flat ranked list of the most popular experiences across Amiva.
 *
 * Popularity = recency (exponential decay, ~1 week half-life) × star
 * rating. Computed on-read — MVP-acceptable per technical_specification.md
 * §4.3's precedent for feed ranking. No "liked" signal exists (spec §8).
 *
 * Privacy: the Admin SDK bypasses firestore.rules entirely, so this
 * function is the actual enforcement point for who can see whose
 * experiences in Trending — every candidate is checked against
 * lib/visibility.ts's `isVisibleTo` before scoring. `viewerId` is needed
 * both for that friend-edge check and to compute the per-card match %.
 */
import { defaultMatchScorer, MatchScorer, TravelStyleVector } from '@amiva/core';
import { FriendStore, UserStore, VisibilityStore } from './ports';
import { isVisibleTo } from './visibility';

const TRENDING_HALF_LIFE_DAYS = 7;
const TRENDING_LAMBDA = Math.log(2) / TRENDING_HALF_LIFE_DAYS;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TrendingCandidate {
  experienceId: string;
  ownerId: string;
  title: string;
  city: string;
  country: string;
  categoryScores: TravelStyleVector;
  rating: number;
  createdAt: Date;
}

export interface TrendingStore {
  listRecentExperiences(
    locationFilter: { country?: string; city?: string },
    limit: number,
  ): Promise<TrendingCandidate[]>;
}

export interface TrendingResultItem {
  experienceId: string;
  trendingScore: number;
  /** Viewer's match % against this experience — for the card badge only,
   * not part of the ranking. */
  matchScore: number;
  createdAt: Date;
  categoryScores: TravelStyleVector;
}

function recencyWeight(createdAt: Date, now: Date): number {
  const days = Math.max(0, (now.getTime() - createdAt.getTime()) / MS_PER_DAY);
  return Math.exp(-TRENDING_LAMBDA * days);
}

export async function getTrending(
  stores: {
    trendingStore: TrendingStore;
    userStore: UserStore;
    friendStore: FriendStore;
    visibilityStore: VisibilityStore;
  },
  viewerId: string,
  now: Date,
  limit = 30,
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<TrendingResultItem[]> {
  const [candidates, friendIds, { travelStyle: viewerVector }] = await Promise.all([
    stores.trendingStore.listRecentExperiences({}, limit * 5),
    stores.friendStore.getFriendIdsOf(viewerId),
    stores.userStore.getUserStyle(viewerId),
  ]);

  const friendIdSet = new Set(friendIds);
  const privacyByOwner = await stores.visibilityStore.getPrivacySettings(candidates.map((c) => c.ownerId));

  return candidates
    .filter((c) => isVisibleTo(viewerId, c.ownerId, privacyByOwner[c.ownerId], friendIdSet))
    .map((c) => ({
      experienceId: c.experienceId,
      categoryScores: c.categoryScores,
      trendingScore: recencyWeight(c.createdAt, now) * (c.rating / 5),
      matchScore: matchScorer.score(viewerVector, c.categoryScores),
      createdAt: c.createdAt,
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
}
