/**
 * Backs the group-recommendation part of the Planner/group-trip flow
 * (technical_specification.md §4.4). Resolves collaborator and candidate
 * vectors from Firestore, then delegates the actual blend-vs-segment
 * decision to the pure @amiva/core implementation.
 */
import { Collaborator, computeGroupRecommendation as coreComputeGroupRecommendation, GroupRecommendation, MatchScorer } from '@amiva/core';
import { ExperienceStore, UserStore } from './ports';

export async function computeGroupRecommendationForCandidate(
  stores: { userStore: UserStore; experienceStore: ExperienceStore },
  collaboratorIds: string[],
  candidateExperienceId: string,
  varianceThreshold: number,
  matchScorer?: MatchScorer,
): Promise<GroupRecommendation> {
  const [collaborators, candidate] = await Promise.all([
    Promise.all(
      collaboratorIds.map(
        async (collaboratorId): Promise<Collaborator> => ({
          collaboratorId,
          travelStyle: (await stores.userStore.getUserStyle(collaboratorId)).travelStyle,
        }),
      ),
    ),
    stores.experienceStore.getExperience(candidateExperienceId),
  ]);

  return coreComputeGroupRecommendation(collaborators, candidate.categoryScores, {
    varianceThreshold,
    matchScorer,
  });
}
