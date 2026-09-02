/**
 * Add a friend to a planned trip as a co-editor
 * (functional_specification.md §6.1). A callable rather than a client
 * write because it also fires a `group_trip_joined` notification
 * (§6.5) — see lib/tripCollaborators.ts. Mirrors onFriendAdded.
 */
import * as functions from 'firebase-functions/v1';
import { FirestoreTripCollaboratorStore } from '../adapters/tripCollaboratorAdapter';
import { addTripCollaborator as addTripCollaboratorLib } from '../lib/tripCollaborators';

interface Request {
  plannedTripId: string;
  collaboratorId: string;
}

export const addTripCollaborator = functions.https.onCall(async (data: Request, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (!data?.plannedTripId || !data?.collaboratorId) {
    throw new functions.https.HttpsError('invalid-argument', 'plannedTripId and collaboratorId are required.');
  }

  try {
    return await addTripCollaboratorLib(new FirestoreTripCollaboratorStore(), {
      plannedTripId: data.plannedTripId,
      actorId: context.auth.uid,
      collaboratorId: data.collaboratorId,
      now: new Date(),
    });
  } catch (err) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      err instanceof Error ? err.message : 'Could not add collaborator.',
    );
  }
});
