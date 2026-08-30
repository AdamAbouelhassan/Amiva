/**
 * Group recommendation blending (functional_specification.md §6.2,
 * technical_specification.md §4.4) via the `computeGroupRecommendation`
 * callable — blended when the group is aligned, segmented per-collaborator
 * when it diverges, never a forced single compromise.
 *
 * The candidate pool itself also went through a callable
 * (`getGroupRecommendationCandidates`) rather than the client's old direct
 * `ExperienceRepository.listRecentForFeed` query — that query hit the same
 * privacy-rule limitation Discover's Feed/Trending did (see
 * discovery/hooks/useFeed.ts's header for the full explanation) and would
 * fail outright the instant any candidate's owner wasn't public.
 */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';

interface GroupRecommendationResult {
  type: 'blended' | 'segmented';
  variance: number;
  matchScore?: number;
  perCollaborator?: Array<{ collaboratorId: string; matchScore: number }>;
}

interface GroupCandidateResult {
  experienceId: string;
  title: string;
}

const getGroupRecommendationCandidatesCallable = httpsCallable<
  { collaboratorIds: string[]; limit?: number },
  GroupCandidateResult[]
>(functions, 'getGroupRecommendationCandidates');

const computeGroupRecommendationCallable = httpsCallable<
  { collaboratorIds: string[]; candidateExperienceId: string },
  GroupRecommendationResult
>(functions, 'computeGroupRecommendation');

export function useGroupRecommendationCandidates(collaboratorIds: string[], enabled: boolean) {
  const candidatesQuery = useQuery({
    queryKey: ['groupRecommendationCandidates', collaboratorIds],
    queryFn: async () => (await getGroupRecommendationCandidatesCallable({ collaboratorIds })).data,
    enabled,
  });

  const scoredQuery = useQuery({
    queryKey: ['groupRecommendations', collaboratorIds, candidatesQuery.data?.map((c) => c.experienceId)],
    queryFn: async () => {
      const results = await Promise.all(
        (candidatesQuery.data ?? []).map(async (candidate) => ({
          experienceId: candidate.experienceId,
          title: candidate.title,
          recommendation: (
            await computeGroupRecommendationCallable({ collaboratorIds, candidateExperienceId: candidate.experienceId })
          ).data,
        })),
      );
      return results;
    },
    enabled: enabled && !!candidatesQuery.data,
  });

  const firstError = candidatesQuery.error ?? scoredQuery.error;

  return {
    data: scoredQuery.data ?? [],
    isLoading: candidatesQuery.isLoading || scoredQuery.isLoading,
    error: firstError instanceof Error ? firstError.message : undefined,
  };
}
