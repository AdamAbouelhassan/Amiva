import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { ExperienceRepository } from '../../../repositories/experienceRepository';
import { SaveRepository } from '../../../repositories/saveRepository';

/** Source #1 for adding items to a planned trip's itinerary
 * (functional_specification.md §4.2, priority order over recommended). */
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
      const experiences = await Promise.all((savesQuery.data ?? []).map((s) => ExperienceRepository.getById(s.experienceId)));
      return experiences.filter((e): e is NonNullable<typeof e> => !!e);
    },
    enabled: !!savesQuery.data,
  });

  return { data: experiencesQuery.data ?? [], isLoading: savesQuery.isLoading || experiencesQuery.isLoading };
}
