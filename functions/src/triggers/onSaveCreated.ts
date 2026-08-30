/** technical_specification.md §5: "Recompute owner's travel style (saved weight)." */
import * as functions from 'firebase-functions/v1';
import { FirestoreConfigStore } from '../adapters/configAdapter';
import { FirestoreExperienceStore } from '../adapters/experienceAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { resolveScoringConfig } from '../lib/remoteConfig';
import { applyExperienceStyleEvent } from '../lib/travelStyleUpdate';

export const onSaveCreated = functions.firestore.document('saves/{saveId}').onCreate(async (snap) => {
  const data = snap.data();
  const now = new Date();

  const experience = await new FirestoreExperienceStore().getExperience(data.experienceId);
  const config = await resolveScoringConfig(new FirestoreConfigStore());

  await applyExperienceStyleEvent(new FirestoreUserStore(), {
    userId: data.userId,
    experienceVector: experience.categoryScores,
    isLogged: false,
    eventDate: now,
    decayConfig: config.decay,
  });
});
