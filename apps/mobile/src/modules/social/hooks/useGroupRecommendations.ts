/**
 * Group recommendation blending (functional_specification.md §6.2,
 * technical_specification.md §4.4) via the `computeGroupRecommendation`
 * callable — blended when the group is aligned, segmented per-collaborator
 * when it diverges, never a forced single compromise.
 */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';
import { ExperienceRepository } from '../../../repositories/experienceRepository';

interface GroupRecommendationResult {
  type: 'blended' | 'segmented';
  variance: number;
  matchScore?: number;
  perCollaborator?: Array<{ collaboratorId: string; matchScore: number }>;
}

const computeGroupRecommendationCallable = httpsCallable<
  { collaboratorIds: string[]; candidateExperienceId: string },
  GroupRecommendationResult
>(functions, 'computeGroupRecommendation');

/** A handful of candidate experiences to preview the group's fit against —
 * drawn from the general pool the Discovery recommendation surface also
 * uses (see discovery/hooks/useRecommendations.ts for the same
 * "no dedicated recommendation pipeline yet" caveat). */
export function useGroupRecommendationCandidates(collaboratorIds: string[], enabled: boolean) {
  const candidatesQuery = useQuery({
    queryKey: ['experiences', 'groupCandidates'],
    queryFn: () => ExperienceRepository.listRecentForFeed(10),
    enabled,
  });

  const scoredQuery = useQuery({
    queryKey: ['groupRecommendations', collaboratorIds, candidatesQuery.data?.map((e) => e.experienceId)],
    queryFn: async () => {
      const results = await Promise.all(
        (candidatesQuery.data ?? []).map(async (experience) => ({
          experience,
          recommendation: (
            await computeGroupRecommendationCallable({
              collaboratorIds,
              candidateExperienceId: experience.experienceId,
            })
          ).data,
        })),
      );
      return results;
    },
    enabled: enabled && !!candidatesQuery.data,
  });

  return { data: scoredQuery.data ?? [], isLoading: candidatesQuery.isLoading || scoredQuery.isLoading };
}
