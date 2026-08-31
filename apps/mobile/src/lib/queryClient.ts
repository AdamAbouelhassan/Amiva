import { QueryClient } from '@tanstack/react-query';

/**
 * Single React Query client for the app — repositories are wrapped by
 * hooks (CLAUDE.md #1, #5), and this is the cache/sync layer those hooks
 * sit on top of.
 *
 * Caching policy: Amiva data (profiles, experiences, trips, match scores,
 * saved lists) changes on the order of minutes, not seconds, and the app
 * is navigation-heavy — jumping between tabs and into profiles constantly.
 * So cached data is treated as fresh for 5 minutes (no refetch when a
 * screen re-mounts or a tab is re-focused within that window) and kept in
 * memory for an hour after nothing is using it, so going back to a screen
 * is instant. Writes still call `queryClient.invalidateQueries(...)`, which
 * forces an immediate refetch regardless of `staleTime`, so edits show up
 * right away.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 60 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});
