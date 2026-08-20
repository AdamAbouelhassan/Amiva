/** Global / location-scoped / personalized trending
 * (functional_specification.md §5.4), via the `getTrending` callable —
 * the source of truth stays server-side per technical_specification.md
 * §5. */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';

export type TrendingScope = { scope: 'global' } | { scope: 'location'; country: string; city?: string } | { scope: 'personalized' };

interface TrendingResultItem {
  experienceId: string;
  trendingScore: number;
  matchScore?: number;
}

const getTrendingCallable = httpsCallable<TrendingScope, TrendingResultItem[]>(functions, 'getTrending');

export function useTrending(scope: TrendingScope, enabled: boolean) {
  return useQuery({
    queryKey: ['trending', scope],
    queryFn: async () => (await getTrendingCallable(scope)).data,
    enabled,
  });
}
