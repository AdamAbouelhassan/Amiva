import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TripRepository } from '../../../repositories/tripRepository';
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
    queryFn: () => TripRepository.getById(tripId!),
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

export function useUpdateTripDateRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, startDate, endDate }: { tripId: string; startDate: Date; endDate: Date }) =>
      TripRepository.updateDateRange(tripId, startDate, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}
