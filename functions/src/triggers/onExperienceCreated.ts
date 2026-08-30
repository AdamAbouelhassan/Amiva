/**
 * technical_specification.md §5: "Recompute owner's travel style (logged
 * weight); update trip aggregate; check for trending signal."
 *
 * Trending itself is computed on-read by `getTrending` (see
 * lib/trending.ts's header comment for why no extra write happens here) —
 * this trigger's job is just the two writes: the style update and the
 * trip cover-photo default.
 */
import * as functions from 'firebase-functions/v1';
import { TravelStyleVector } from '@amiva/core';
import { FirestoreConfigStore } from '../adapters/configAdapter';
import { FirestoreTripStore } from '../adapters/tripAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { applyExperienceStyleEvent } from '../lib/travelStyleUpdate';
import { maybeSetTripCoverPhoto } from '../lib/tripCoverPhoto';
import { resolveScoringConfig } from '../lib/remoteConfig';

export const onExperienceCreated = functions.firestore
  .document('experiences/{experienceId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const now = new Date();

    const config = await resolveScoringConfig(new FirestoreConfigStore());

    await applyExperienceStyleEvent(new FirestoreUserStore(), {
      userId: data.ownerId,
      experienceVector: data.categoryScores as TravelStyleVector,
      isLogged: true,
      eventDate: now,
      decayConfig: config.decay,
    });

    if (data.tripId) {
      await maybeSetTripCoverPhoto(new FirestoreTripStore(), data.tripId, data.photoUrls ?? []);
    }
  });
