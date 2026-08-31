import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orNull } from '../../../lib/queryHelpers';
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

export function useTripExperiences(tripId: string | undefined, ownerId: string | undefined) {
  return useQuery({
    queryKey: ['experiences', 'byTrip', tripId],
    queryFn: () => ExperienceRepository.listByTrip(tripId!, ownerId!),
    enabled: !!tripId && !!ownerId,
  });
}

export function useExperience(experienceId: string | undefined) {
  return useQuery({
    queryKey: ['experiences', experienceId],
    queryFn: () => ExperienceRepository.getById(experienceId!).then(orNull),
    enabled: !!experienceId,
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      experienceId,
      patch,
    }: {
      experienceId: string;
      patch: Parameters<typeof ExperienceRepository.update>[1];
    }) => ExperienceRepository.update(experienceId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (experienceId: string) => ExperienceRepository.delete(experienceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
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
