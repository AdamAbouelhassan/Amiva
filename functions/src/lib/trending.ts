/**
 * Backs the `getTrending` callable (technical_specification.md §5) across
 * its global / personalized views (functional_specification.md §5.4),
 * now also organized into sections by the viewer's top travel-style
 * categories (packages/core's sectionByTopCategories) — "same activity
 * organization logic" as Feed, per the Discover rebuild (2026-08-30),
 * minus the friend-tier concept ("not necessarily from your network").
 * Location scoping is folded into TrendingFilter (country/city) rather
 * than being a third scope variant, so it composes with either weighting
 * and with search text — same shape as Feed's filter.
 *
 * Trending scoring: recency (exponential decay, ~1 week half-life)
 * combined with star rating, multiplied by the viewer's match score for
 * the personalized view. Computed on-read — an MVP-acceptable strategy
 * per technical_specification.md §4.3's precedent for feed ranking.
 *
 * Privacy: the Admin SDK bypasses firestore.rules entirely, so this
 * function is the actual enforcement point for who can see whose
 * experiences in Trending — every candidate is checked against
 * lib/visibility.ts's isVisibleTo before scoring, the same rule
 * canReadOwnedBy encodes in firestore.rules. This requires knowing the
 * viewer's identity (to resolve friend edges and to compute section
 * headers from their travelStyle), so viewerId is now a required
 * parameter for every scope, not just 'personalized'.
 */
import {
  defaultMatchScorer,
  FeedSection,
  MatchScorer,
  sectionByTopCategories,
  TravelStyleVector,
} from '@amiva/core';
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

/** Whether within-section ranking additionally weights by the viewer's
 * personal match score, or is purely popularity (recency × rating).
 * Location scoping isn't a separate scope anymore — it's just another
 * filter dimension (below), composable with either weighting, the same
 * way Feed's filter works. */
export type TrendingScope = { type: 'global' } | { type: 'personalized' };

export interface TrendingFilter {
  text?: string;
  country?: string;
  city?: string;
}

export interface TrendingResultItem {
  experienceId: string;
  trendingScore: number;
  matchScore?: number;
  createdAt: Date;
  categoryScores: TravelStyleVector;
}

function recencyWeight(createdAt: Date, now: Date): number {
  const days = Math.max(0, (now.getTime() - createdAt.getTime()) / MS_PER_DAY);
  return Math.exp(-TRENDING_LAMBDA * days);
}

function matchesFilter(candidate: TrendingCandidate, filter: TrendingFilter): boolean {
  const text = filter.text?.trim().toLowerCase();
  const country = filter.country?.trim().toLowerCase();
  const city = filter.city?.trim().toLowerCase();
  if (text && !candidate.title.toLowerCase().includes(text)) return false;
  if (country && candidate.country.toLowerCase() !== country) return false;
  if (city && candidate.city.toLowerCase() !== city) return false;
  return true;
}

export async function getTrending(
  stores: { trendingStore: TrendingStore; userStore: UserStore; friendStore: FriendStore; visibilityStore: VisibilityStore },
  viewerId: string,
  scope: TrendingScope,
  filter: TrendingFilter = {},
  now: Date,
  limit = 20,
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<FeedSection<TrendingResultItem>[]> {
  // Over-fetch a wider candidate pool than `limit`, then rank + filter
  // in-memory (country/city included — see matchesFilter) — fine at MVP
  // data volumes, same allowance technical_specification.md §4.3 makes
  // for feed ranking, and the same approach Feed's filter takes.
  const [candidates, friendIds, { travelStyle: viewerVector }] = await Promise.all([
    stores.trendingStore.listRecentExperiences({}, limit * 5),
    stores.friendStore.getFriendIdsOf(viewerId),
    stores.userStore.getUserStyle(viewerId),
  ]);

  const friendIdSet = new Set(friendIds);
  const privacyByOwner = await stores.visibilityStore.getPrivacySettings(candidates.map((c) => c.ownerId));

  const visible = candidates.filter(
    (c) => matchesFilter(c, filter) && isVisibleTo(viewerId, c.ownerId, privacyByOwner[c.ownerId], friendIdSet),
  );

  const usePersonalizedWeighting = scope.type === 'personalized';
  const scored = visible.map((candidate) => {
    const base = recencyWeight(candidate.createdAt, now) * (candidate.rating / 5);
    const matchScore = matchScorer.score(viewerVector, candidate.categoryScores);
    return {
      experienceId: candidate.experienceId,
      categoryScores: candidate.categoryScores,
      trendingScore: usePersonalizedWeighting ? base * matchScore : base,
      matchScore: usePersonalizedWeighting ? matchScore : undefined,
      createdAt: candidate.createdAt,
    };
  });

  return sectionByTopCategories(scored, viewerVector, {
    sort: (a, b) => b.trendingScore - a.trendingScore,
  }).map((section) => ({
    category: section.category,
    items: section.items.slice(0, limit),
  }));
}
