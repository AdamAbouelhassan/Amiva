import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Pull-to-refresh for any screen. `onRefresh` re-fetches every query that's
 * currently mounted (`type: 'active'`), so a screen doesn't have to know
 * which queries it uses — wire `{ refreshing, onRefresh }` into a
 * `ScreenContainer` (scroll) or a `FlatList` and pulling down refreshes
 * whatever that screen is showing.
 */
export function useRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, onRefresh };
}
