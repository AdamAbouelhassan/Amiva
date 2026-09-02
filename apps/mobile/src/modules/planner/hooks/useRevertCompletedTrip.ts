/** Remove your own copy of a shared planned trip from your Logbook —
 * deletes that Logbook trip, detaches any experiences you logged into it,
 * and (once the last participant's copy is gone) restores the plan to
 * "planning". */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';

const revertCallable = httpsCallable<{ plannedTripId: string }, { detachedExperiences: number }>(
  functions,
  'revertCompletedTrip',
);

export function useRevertCompletedTrip(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revertCallable({ plannedTripId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedTrips'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}
