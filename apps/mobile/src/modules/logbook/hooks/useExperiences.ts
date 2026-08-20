import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateExperienceInput, ExperienceRepository } from '../../../repositories/experienceRepository';

export function useOwnerExperiences(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['experiences', 'byOwner', ownerId],
    queryFn: () => ExperienceRepository.listByOwner(ownerId!),
    enabled: !!ownerId,
  });
}

export function useCityExperiences(ownerId: string | undefined, country: string, city: string) {
  return useQuery({
    queryKey: ['experiences', 'byOwnerCountryCity', ownerId, country, city],
    queryFn: () => ExperienceRepository.listByOwnerCountryCity(ownerId!, country, city),
    enabled: !!ownerId,
  });
}

export function useTripExperiences(tripId: string | undefined) {
  return useQuery({
    queryKey: ['experiences', 'byTrip', tripId],
    queryFn: () => ExperienceRepository.listByTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useExperience(experienceId: string | undefined) {
  return useQuery({
    queryKey: ['experiences', experienceId],
    queryFn: () => ExperienceRepository.getById(experienceId!),
    enabled: !!experienceId,
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExperienceInput) => ExperienceRepository.create(input),
    onSuccess: (experience) => {
      queryClient.invalidateQueries({ queryKey: ['experiences', 'byOwner', experience.ownerId] });
      if (experience.tripId) {
        queryClient.invalidateQueries({ queryKey: ['experiences', 'byTrip', experience.tripId] });
        queryClient.invalidateQueries({ queryKey: ['trips', experience.tripId] });
      }
      // A newly-logged experience also nudges the owner's travel style
      // server-side (onExperienceCreated) — refresh the cached profile so
      // the UI picks up the new vector next time it's shown.
      queryClient.invalidateQueries({ queryKey: ['users', experience.ownerId] });
    },
  });
}
