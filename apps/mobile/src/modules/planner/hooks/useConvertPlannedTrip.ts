/**
 * Completion flow (functional_specification.md §4.3, 2026-08 rework):
 * hand the callable the photos the user just added; it creates one Logbook
 * trip mirroring the plan and links them. Per-item experience conversion is
 * deferred — the user logs into the new trip afterwards.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';

const completeCallable = httpsCallable<{ plannedTripId: string; photoUrls: string[] }, { tripId: string }>(
  functions,
  'convertPlannedTripToLogbook',
);

export function useCompletePlannedTrip(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoUrls: string[]) =>
      completeCallable({ plannedTripId, photoUrls }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedTrips'] });
      queryClient.invalidateQueries({ queryKey: ['plannedTripItems', plannedTripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
