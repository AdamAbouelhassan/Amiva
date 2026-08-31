/** Discovery "Trending" tab — one flat ranked list of the most popular
 * experiences across Amiva (recency × star rating), via the `getTrending`
 * callable. Source of truth + privacy enforcement stay server-side (see
 * functions/src/lib/trending.ts). */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export interface TrendingResultItem {
  experienceId: string;
  trendingScore: number;
  matchScore: number;
}

const getTrendingCallable = httpsCallable<{ limit?: number }, TrendingResultItem[]>(functions, 'getTrending');

export function useTrending() {
  const { profile } = useCurrentUser();
  const query = useQuery({
    queryKey: ['trending', profile?.uid],
    queryFn: async () => (await getTrendingCallable({})).data,
    enabled: !!profile,
  });
  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : undefined,
    refetch: query.refetch,
  };
}
