import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orNull } from '../../../lib/queryHelpers';
import { ExperienceRepository } from '../../../repositories/experienceRepository';
import { TripRepository, UpdateTripPatch } from '../../../repositories/tripRepository';
import { TripDoc } from '../../../repositories/types';

export function useTrips(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['trips', 'byOwner', ownerId],
    queryFn: () => TripRepository.listByOwner(ownerId!),
    enabled: !!ownerId,
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', tripId],
    queryFn: () => TripRepository.getById(tripId!).then(orNull),
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof TripRepository.create>[0]) => TripRepository.create(input),
    onSuccess: (trip: TripDoc) => {
      queryClient.invalidateQueries({ queryKey: ['trips', 'byOwner', trip.ownerId] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, patch }: { tripId: string; patch: UpdateTripPatch }) =>
      TripRepository.update(tripId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, ownerId }: { tripId: string; ownerId: string }) =>
      TripRepository.delete(tripId, ownerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}

/** Attach an experience to a trip, or detach it (tripId = null). */
export function useAttachExperienceToTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ experienceId, tripId }: { experienceId: string; tripId: string | null }) =>
      ExperienceRepository.setTrip(experienceId, tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
