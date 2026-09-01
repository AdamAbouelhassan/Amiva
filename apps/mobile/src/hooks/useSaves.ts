/**
 * The user's saved items — Amiva experiences (`saves`) and raw Google
 * Places saved from Discovery (`savedPlaces`). Both feed the Planner
 * (functional_specification.md §4.2) and are browsable/removable from the
 * Saved screen. Promoted here (from modules/planner) once a second module
 * needed them.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TravelStyleVector } from '@amiva/core';
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

export interface SaveToggle {
  saved: boolean;
  toggle: () => void;
  pending: boolean;
}

/**
 * A saved/not-saved toggle backed by a boolean query, with a **synchronous**
 * optimistic flip: `toggle()` sets local state in the same tick, so the
 * bookmark icon never waits on `onMutate` / the network. The local override
 * is dropped once the mutation settles (the query cache — kept in sync by
 * `onMutate` / `onSettled` — is authoritative from then on).
 */
function useOptimisticToggle(config: {
  queryKey: readonly unknown[];
  enabled: boolean;
  read: () => Promise<boolean>;
  write: (next: boolean) => Promise<void>;
  /** Broader lists to refetch after a change. */
  invalidateKeys: readonly unknown[][];
}): SaveToggle {
  const { queryKey, enabled, read, write, invalidateKeys } = config;
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey, queryFn: read, enabled });
  const server = query.data;

  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const mutation = useMutation({
    mutationFn: write,
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<boolean>(queryKey);
      queryClient.setQueryData<boolean>(queryKey, next);
      return { prev };
    },
    onError: (_err, _next, ctx) => queryClient.setQueryData(queryKey, ctx?.prev),
    onSettled: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries({ queryKey: key });
    },
  });

  // Reconcile to the query only once nothing is in flight — otherwise a
  // slow initial `read()` resolving mid-toggle could flash the stale value.
  useEffect(() => {
    if (!mutation.isPending && server !== undefined) setOptimistic(null);
  }, [mutation.isPending, server]);

  const saved = optimistic ?? !!server;

  return {
    saved,
    pending: mutation.isPending,
    toggle: () => {
      const next = !saved;
      setOptimistic(next); // synchronous — the icon flips this render
      mutation.mutate(next);
    },
  };
}

/** Save-state + optimistic toggle for one Amiva experience (`saves`). */
export function useSaveToggle(experienceId: string): SaveToggle {
  const { profile } = useCurrentUser();
  return useOptimisticToggle({
    queryKey: ['saves', profile?.uid, experienceId],
    enabled: !!profile,
    read: () => SaveRepository.isSaved(profile!.uid, experienceId),
    write: (next) =>
      next ? SaveRepository.save(profile!.uid, experienceId) : SaveRepository.unsave(profile!.uid, experienceId),
    invalidateKeys: [['saves'], ['experiences', 'saved']],
  });
}

/** Save-state + optimistic toggle for a raw Google place (`savedPlaces`). */
export function useSavedPlaceToggle(
  place: {
    placeId: string;
    name: string;
    country: string;
    city: string;
    lat: number;
    lng: number;
    photoRef?: string;
    categoryScores: TravelStyleVector;
  },
  enabled = true,
): SaveToggle {
  const { profile } = useCurrentUser();
  return useOptimisticToggle({
    queryKey: ['savedPlaces', 'isSaved', profile?.uid, place.placeId],
    enabled: !!profile && enabled,
    read: () => SavedPlaceRepository.isSaved(profile!.uid, place.placeId),
    write: (next) =>
      next
        ? SavedPlaceRepository.save({ userId: profile!.uid, ...place })
        : SavedPlaceRepository.unsave(profile!.uid, place.placeId),
    invalidateKeys: [['savedPlaces']],
  });
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
