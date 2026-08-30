/**
 * Social feed — functional_specification.md §5.1, ranked per
 * technical_specification.md §4.3's friends-first / non-friend-fallback
 * tiering, and organized into sections by the viewer's top travel-style
 * categories (Discover rebuild, 2026-08-30).
 *
 * This now calls the `getFeed` callable rather than querying `experiences`
 * directly. Reason: firestore.rules gates experience reads by the owner's
 * privacySetting via a get() on another document, which Firestore can't
 * prove a collection query's results would all satisfy (the same
 * limitation behind the `usernames` lookup-collection pattern in
 * CLAUDE.md) — a client-side query spanning many friends'/strangers'
 * experiences gets rejected outright the moment any of them isn't public.
 * See functions/src/lib/feed.ts for the server-side implementation, which
 * is also the actual enforcement point for who can see whose experiences
 * here.
 */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { TravelStyleCategory } from '@amiva/core';
import { functions } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export interface FeedFilter {
  text?: string;
  country?: string;
  city?: string;
}

export interface FeedResultItem {
  experienceId: string;
  isFriend: boolean;
  matchScore: number;
}

export interface FeedSectionResult {
  category: TravelStyleCategory;
  items: FeedResultItem[];
}

const getFeedCallable = httpsCallable<{ filter?: FeedFilter; limit?: number }, FeedSectionResult[]>(functions, 'getFeed');

export function useFeed(filter: FeedFilter = {}) {
  const { profile } = useCurrentUser();

  const query = useQuery({
    queryKey: ['feed', profile?.uid, filter],
    queryFn: async () => (await getFeedCallable({ filter })).data,
    enabled: !!profile,
  });

  return {
    sections: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : undefined,
    refetch: query.refetch,
  };
}
