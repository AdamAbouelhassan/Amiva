/** Undo an accidental completion — deletes the Logbook trip completion
 * created, detaches any experiences logged into it, restores the plan. */
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
