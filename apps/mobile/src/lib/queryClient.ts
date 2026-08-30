import { QueryClient } from '@tanstack/react-query';

/** Single React Query client for the app — repositories are wrapped by
 * hooks (CLAUDE.md #1, #5), and this is the cache/sync layer those hooks
 * sit on top of. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
