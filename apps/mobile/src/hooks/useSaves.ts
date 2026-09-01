/**
 * The user's saved items — Amiva experiences (`saves`) and raw Google
 * Places saved from Discovery (`savedPlaces`). Both feed the Planner
 * (functional_specification.md §4.2) and are browsable/removable from the
 * Saved screen. Promoted here (from modules/planner) once a second module
 * needed them.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { ExperienceRepository } from '../repositories/experienceRepository';
import { SaveRepository } from '../repositories/saveRepository';
import { SavedPlaceRepository } from '../repositories/savedPlaceRepository';
import { ExperienceDoc, SavedPlaceDoc } from '../repositories/types';

/** A saved thing — a logged Amiva experience, or a raw Google place from
 * the Local tab. The user treats both as "an experience I want to keep". */
export type SavedItem =
  | { kind: 'experience'; id: string; savedAt: Date; experience: ExperienceDoc }
  | { kind: 'place'; id: string; savedAt: Date; place: SavedPlaceDoc };

export function useSavedExperiences() {
  const { profile } = useCurrentUser();
  const savesQuery = useQuery({
    queryKey: ['saves', profile?.uid],
    queryFn: () => SaveRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });

  const experiencesQuery = useQuery({
    queryKey: ['experiences', 'saved', profile?.uid, savesQuery.data?.map((s) => s.experienceId)],
    queryFn: async () => {
      const experiences = await Promise.all(
        (savesQuery.data ?? []).map((s) => ExperienceRepository.getById(s.experienceId)),
      );
      return experiences.filter((e): e is NonNullable<typeof e> => !!e);
    },
    enabled: !!savesQuery.data,
  });

  return {
    data: experiencesQuery.data ?? [],
    isLoading: savesQuery.isLoading || experiencesQuery.isLoading,
  };
}

export function useSavedPlaces() {
  const { profile } = useCurrentUser();
  const query = useQuery({
    queryKey: ['savedPlaces', profile?.uid],
    queryFn: () => SavedPlaceRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });
  return { data: query.data ?? [], isLoading: query.isLoading };
}

/** One merged, newest-first list of everything the user has saved — the
 * Saved screen. */
export function useSavedItems() {
  const { profile } = useCurrentUser();

  const savesQuery = useQuery({
    queryKey: ['saves', profile?.uid],
    queryFn: () => SaveRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });

  const placesQuery = useQuery({
    queryKey: ['savedPlaces', profile?.uid],
    queryFn: () => SavedPlaceRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });

  const experiencesQuery = useQuery({
    queryKey: ['experiences', 'saved', profile?.uid, savesQuery.data?.map((s) => s.experienceId)],
    queryFn: async () => {
      const pairs = await Promise.all(
        (savesQuery.data ?? []).map(async (s) => {
          const experience = await ExperienceRepository.getById(s.experienceId);
          return experience ? { experience, savedAt: s.savedAt } : null;
        }),
      );
      return pairs.filter((p): p is NonNullable<typeof p> => !!p);
    },
    enabled: !!savesQuery.data,
  });

  const items: SavedItem[] = [
    ...(experiencesQuery.data ?? []).map((p) => ({
      kind: 'experience' as const,
      id: p.experience.experienceId,
      savedAt: p.savedAt,
      experience: p.experience,
    })),
    ...(placesQuery.data ?? []).map((place) => ({
      kind: 'place' as const,
      id: place.placeId,
      savedAt: place.savedAt,
      place,
    })),
  ].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

  return {
    items,
    isLoading: savesQuery.isLoading || placesQuery.isLoading || experiencesQuery.isLoading,
  };
}

/**
 * Save-state + toggle for a single experience, with an optimistic icon
 * flip. The bare `invalidateQueries` version raced the Firestore re-read
 * and left the bookmark icon stale after an un-save.
 */
export function useSaveToggle(experienceId: string) {
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  const key = ['saves', profile?.uid, experienceId] as const;

  const savedQuery = useQuery({
    queryKey: key,
    queryFn: () => SaveRepository.isSaved(profile!.uid, experienceId),
    enabled: !!profile,
  });

  const mutation = useMutation({
    // `next` = the state we want to be in after the tap. Passed explicitly
    // so we never depend on a possibly-stale render closure.
    mutationFn: async (next: boolean) => {
      if (!profile) return;
      if (next) await SaveRepository.save(profile.uid, experienceId);
      else await SaveRepository.unsave(profile.uid, experienceId);
    },
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<boolean>(key);
      queryClient.setQueryData<boolean>(key, next);
      return { prev };
    },
    onError: (_err, _next, ctx) => {
      queryClient.setQueryData(key, ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saves'] });
      queryClient.invalidateQueries({ queryKey: ['experiences', 'saved'] });
    },
  });

  const saved = !!savedQuery.data;
  return { saved, toggle: () => mutation.mutate(!saved), pending: mutation.isPending };
}

export function useUnsaveExperience() {
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  return useMutation({
    mutationFn: (experienceId: string) => SaveRepository.unsave(profile!.uid, experienceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saves'] });
      queryClient.invalidateQueries({ queryKey: ['experiences', 'saved'] });
    },
  });
}

export function useUnsavePlace() {
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  return useMutation({
    mutationFn: (placeId: string) => SavedPlaceRepository.unsave(profile!.uid, placeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedPlaces'] }),
  });
}
