import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { PlannedTripItemRepository } from '../../../repositories/plannedTripItemRepository';
import { PlannedTripRepository, UpdatePlannedTripPatch } from '../../../repositories/plannedTripRepository';
import { PlannedTripStatus } from '../../../repositories/types';

const addCollaboratorCallable = httpsCallable<
  { plannedTripId: string; collaboratorId: string },
  { added: boolean }
>(functions, 'addTripCollaborator');

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

export function useUpdatePlannedTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plannedTripId, patch }: { plannedTripId: string; patch: UpdatePlannedTripPatch }) =>
      PlannedTripRepository.update(plannedTripId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plannedTrips'] }),
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

export function useDeletePlannedTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plannedTripId: string) => PlannedTripRepository.delete(plannedTripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedTrips'] });
      queryClient.invalidateQueries({ queryKey: ['plannedTripItems'] });
    },
  });
}

/** Add a friend as a co-editor (functional_specification.md §6.1). Goes
 * through the callable so the new collaborator gets a `group_trip_joined`
 * notification. */
export function useAddTripCollaborator(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collaboratorId: string) =>
      addCollaboratorCallable({ plannedTripId, collaboratorId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedTrips'] });
    },
  });
}

export function useRemoveTripCollaborator(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collaboratorId: string) =>
      PlannedTripRepository.removeCollaborator(plannedTripId, collaboratorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedTrips'] });
    },
  });
}

export function useRemovePlannedTripItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, plannedTripId }: { itemId: string; plannedTripId: string }) =>
      PlannedTripItemRepository.delete(itemId, plannedTripId),
    onSuccess: (_data, { plannedTripId }) => {
      queryClient.invalidateQueries({ queryKey: ['plannedTripItems', plannedTripId] });
      queryClient.invalidateQueries({ queryKey: ['plannedTrips', plannedTripId] });
    },
  });
}
