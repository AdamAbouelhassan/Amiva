/** Social-specific: adding a collaborator to a group trip
 * (functional_specification.md §6.1). Data reads for the trip/items
 * themselves live in the shared `usePlannedTripData` (see
 * hooks/usePlannedTripData.ts) — re-exported here too so existing
 * Social-module imports keep working. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlannedTripRepository } from '../../../repositories/plannedTripRepository';

export { usePlannedTrip, usePlannedTripItems, useToggleItemCompleted } from '../../../hooks/usePlannedTripData';

/** Unlimited collaborators, direct-add, shared-doc-style co-editing
 * (functional_specification.md §6.1). */
export function useAddCollaborator(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collaboratorId: string) => PlannedTripRepository.addCollaborator(plannedTripId, collaboratorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plannedTrips', plannedTripId] }),
  });
}
