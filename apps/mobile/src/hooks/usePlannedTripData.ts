/** Planned-trip reads shared by the Planner screens (detail, complete,
 * add-places) — one place for the query keys so a collaborator's edit
 * invalidates everywhere. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orNull } from '../lib/queryHelpers';
import { PlannedTripItemRepository } from '../repositories/plannedTripItemRepository';
import { PlannedTripRepository } from '../repositories/plannedTripRepository';

export function usePlannedTrip(plannedTripId: string | undefined) {
  return useQuery({
    queryKey: ['plannedTrips', plannedTripId],
    queryFn: () => PlannedTripRepository.getById(plannedTripId!).then(orNull),
    enabled: !!plannedTripId,
  });
}

export function usePlannedTripItems(plannedTripId: string | undefined) {
  return useQuery({
    queryKey: ['plannedTripItems', plannedTripId],
    queryFn: () => PlannedTripItemRepository.listByPlannedTrip(plannedTripId!),
    enabled: !!plannedTripId,
  });
}

export function useToggleItemCompleted(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      PlannedTripItemRepository.setCompleted(itemId, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plannedTripItems', plannedTripId] }),
  });
}
