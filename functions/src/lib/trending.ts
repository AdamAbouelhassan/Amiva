/**
 * Backs the `getTrending` callable (technical_specification.md §5) across
 * its three views (functional_specification.md §5.4): global,
 * location-scoped, personalized.
 *
 * Assumption: the spec names "trending" but doesn't define the ranking
 * signal precisely, and CLAUDE.md #4 (Single Responsibility) argues
 * against bolting a new save-counter increment onto `onSaveCreated` just
 * to feed this. So trending here is computed on-read (an MVP-acceptable
 * strategy per technical_specification.md §4.3's precedent for feed
 * ranking) from fields already on each experience: recency (exponential
 * decay, ~1 week half-life) combined with its star rating, and — for the
 * personalized view — multiplied by the viewer's match score against it.
 */
import { defaultMatchScorer, MatchScorer, TravelStyleVector } from '@amiva/core';
import { UserStore } from './ports';

const TRENDING_HALF_LIFE_DAYS = 7;
const TRENDING_LAMBDA = Math.log(2) / TRENDING_HALF_LIFE_DAYS;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TrendingCandidate {
  experienceId: string;
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

export type TrendingScope =
  | { type: 'global' }
  | { type: 'location'; country: string; city?: string }
  | { type: 'personalized'; viewerId: string };

export interface TrendingResultItem {
  experienceId: string;
  trendingScore: number;
  matchScore?: number;
}

function recencyWeight(createdAt: Date, now: Date): number {
  const days = Math.max(0, (now.getTime() - createdAt.getTime()) / MS_PER_DAY);
  return Math.exp(-TRENDING_LAMBDA * days);
}

export async function getTrending(
  stores: { trendingStore: TrendingStore; userStore: UserStore },
  scope: TrendingScope,
  now: Date,
  limit = 20,
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<TrendingResultItem[]> {
  const locationFilter = scope.type === 'location' ? { country: scope.country, city: scope.city } : {};
  // Over-fetch a wider candidate pool than `limit`, then rank in-memory —
  // fine at MVP data volumes, same allowance technical_specification.md
  // §4.3 makes for feed ranking.
  const candidates = await stores.trendingStore.listRecentExperiences(locationFilter, limit * 5);

  let viewerVector: TravelStyleVector | undefined;
  if (scope.type === 'personalized') {
    viewerVector = (await stores.userStore.getUserStyle(scope.viewerId)).travelStyle;
  }

  const scored: TrendingResultItem[] = candidates.map((candidate) => {
    const base = recencyWeight(candidate.createdAt, now) * (candidate.rating / 5);
    const matchScore = viewerVector ? matchScorer.score(viewerVector, candidate.categoryScores) : undefined;
    return {
      experienceId: candidate.experienceId,
      trendingScore: matchScore !== undefined ? base * matchScore : base,
      matchScore,
    };
  });

  return scored.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
}
