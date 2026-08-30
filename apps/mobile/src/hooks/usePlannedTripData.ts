/** Shared across modules (Planner owns the checklist UX, Social's
 * GroupTripDetail reuses the same data) — promoted per CLAUDE.md's "2+
 * modules" rule rather than one module reaching into another's
 * /hooks. */
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
