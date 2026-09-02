/**
 * "Add this shared trip to my Logbook" (functional_specification.md §4.3,
 * 2026-09 shared-trip rework): hand the callable the photos the caller just
 * added; it creates a Logbook trip owned by the caller mirroring the plan
 * and records it in `plannedTrips.loggedTripIds[uid]`. Each participant does
 * this independently; per-item experience conversion is deferred — they log
 * into their own copy afterwards.
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
