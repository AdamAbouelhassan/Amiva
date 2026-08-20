/** technical_specification.md §5: "On-demand similarity computation (e.g.,
 * previewing a match before data is persisted)." */
import * as functions from 'firebase-functions';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { computeMatchScore as computeMatchScoreLib, MatchSubject } from '../lib/computeMatchScore';

interface ComputeMatchScoreRequest {
  a: MatchSubject;
  b: MatchSubject;
}

export const computeMatchScore = functions.https.onCall(async (data: ComputeMatchScoreRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  }
  return computeMatchScoreLib(data.a, data.b, {
    userStore: new FirestoreUserStore(),
    experienceStore: new FirestoreExperienceStore(),
  });
});
