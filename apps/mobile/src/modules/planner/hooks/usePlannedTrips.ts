import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { PlannedTripItemRepository } from '../../../repositories/plannedTripItemRepository';
import { PlannedTripRepository } from '../../../repositories/plannedTripRepository';
import { PlannedTripStatus } from '../../../repositories/types';

/** Multi-trip overview — functional_specification.md §4.1: "Users can
 * plan multiple trips concurrently." */
export function usePlannedTrips() {
  const { profile } = useCurrentUser();
  return useQuery({
    queryKey: ['plannedTrips', 'forUser', profile?.uid],
    queryFn: () => PlannedTripRepository.listForUser(profile!.uid),
    enabled: !!profile,
  });
}

export function useCreatePlannedTrip() {
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  return useMutation({
    mutationFn: (input: Parameters<typeof PlannedTripRepository.create>[0]) => PlannedTripRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plannedTrips', 'forUser', profile?.uid] }),
  });
}

export function useSetPlannedTripStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plannedTripId, status }: { plannedTripId: string; status: PlannedTripStatus }) =>
      PlannedTripRepository.setStatus(plannedTripId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plannedTrips'] });
      queryClient.invalidateQueries({ queryKey: ['plannedTripItems', variables.plannedTripId] });
    },
  });
}

export function useAddPlannedTripItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof PlannedTripItemRepository.create>[0]) =>
      PlannedTripItemRepository.create(input),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['plannedTripItems', item.plannedTripId] });
      queryClient.invalidateQueries({ queryKey: ['plannedTrips', item.plannedTripId] });
    },
  });
}
