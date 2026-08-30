/** Global / personalized trending (functional_specification.md §5.4), via
 * the `getTrending` callable — the source of truth stays server-side per
 * technical_specification.md §5, and is also the actual enforcement point
 * for experience-read privacy here (see functions/src/lib/trending.ts).
 * Organized into sections by the viewer's top travel-style categories,
 * same as Feed (Discover rebuild, 2026-08-30) — "same activity
 * organization logic," minus the friend-tier concept, since Trending is
 * "not necessarily from your network." Location is a filter, not a
 * separate scope, so it composes with search text and either weighting. */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { TravelStyleCategory } from '@amiva/core';
import { functions } from '../../../firebase/client';

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
}

export interface TrendingSectionResult {
  category: TravelStyleCategory;
  items: TrendingResultItem[];
}

const getTrendingCallable = httpsCallable<
  { scope: TrendingScope; filter?: TrendingFilter; limit?: number },
  TrendingSectionResult[]
>(functions, 'getTrending');

export function useTrending(scope: TrendingScope, filter: TrendingFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ['trending', scope, filter],
    queryFn: async () => (await getTrendingCallable({ scope, filter })).data,
    enabled,
  });
}
