/** technical_specification.md §4.4 / §6: group recommendation blending for
 * a planned trip's collaborators, exposed as a callable for the Planner's
 * group-trip recommendation surface. Not named separately in the §5 API
 * table (it's covered there under the general recommendation engine), but
 * needs its own entry point since it takes a candidate experience *and* a
 * set of collaborators, unlike computeMatchScore's single pair. */
import * as functions from 'firebase-functions/v1';
import { FirestoreConfigStore } from '../adapters/configAdapter';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { computeGroupRecommendationForCandidate } from '../lib/groupRecommendation';
import { resolveScoringConfig } from '../lib/remoteConfig';

interface ComputeGroupRecommendationRequest {
  collaboratorIds: string[];
  candidateExperienceId: string;
}

export const computeGroupRecommendation = functions.https.onCall(
  async (data: ComputeGroupRecommendationRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!data.collaboratorIds.includes(context.auth.uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Caller must be one of the trip collaborators.');
    }

    const config = await resolveScoringConfig(new FirestoreConfigStore());

    return computeGroupRecommendationForCandidate(
      { userStore: new FirestoreUserStore(), experienceStore: new FirestoreExperienceStore() },
      data.collaboratorIds,
      data.candidateExperienceId,
      config.groupVarianceThreshold,
    );
  },
);
