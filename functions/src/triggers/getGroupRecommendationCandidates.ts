/** Group Recommendations candidate pool (functional_specification.md
 * §6.2) — see lib/groupRecommendationCandidates.ts's header for why this
 * moved server-side. */
import * as functions from 'firebase-functions/v1';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { getGroupRecommendationCandidates as getGroupRecommendationCandidatesLib } from '../lib/groupRecommendationCandidates';

interface GroupRecommendationCandidatesRequest {
  collaboratorIds: string[];
  limit?: number;
}

export const getGroupRecommendationCandidates = functions.https.onCall(
  async (data: GroupRecommendationCandidatesRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!data.collaboratorIds?.includes(context.auth.uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Caller must be one of the trip collaborators.');
    }

    const experienceStore = new FirestoreExperienceStore();

    return getGroupRecommendationCandidatesLib(
      { candidateStore: experienceStore, visibilityStore: new FirestoreUserStore() },
      data.collaboratorIds,
      data.limit,
    );
  },
);
