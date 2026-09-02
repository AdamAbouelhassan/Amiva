import * as functions from 'firebase-functions/v1';
import { isApprovedPlace } from '@amiva/core';
import { FirestoreConfigStore } from '../adapters/configAdapter';
import { FirestorePlaceStore, PlaceUpsertInput } from '../adapters/placeAdapter';
import { resolveScoringConfig } from '../lib/remoteConfig';

/**
 * `upsertPlace` — registers a Google place in Amiva the first time a user
 * references it (logging an experience). This is **Layer 2** of the type
 * gate (taxonomy-reduction pass, 2026-09-02): the authoritative check that
 * a place is a real travel-experience venue (approved type; and, for a
 * place of worship, a landmark signal). A rejected place is **not
 * persisted** and the client is told, so it can block the log.
 */
export const upsertPlace = functions.https.onCall(
  async (data: PlaceUpsertInput, context): Promise<{ success: true } | { rejected: true; reason?: string }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (!data.placeId || !data.name || !data.country || !data.city) {
      throw new functions.https.HttpsError('invalid-argument', 'placeId, name, country, and city are required.');
    }

    const config = await resolveScoringConfig(new FirestoreConfigStore());
    const gate = isApprovedPlace(
      {
        primaryType: data.googlePlaceType,
        types: data.googlePlaceTypes ?? [],
        userRatingCount: data.userRatingCount,
      },
      config.placeOfWorshipMinRatingCount,
    );
    if (!gate.approved) {
      return { rejected: true, reason: gate.reason };
    }

    await new FirestorePlaceStore().upsertPlace(
      { ...data, googlePlaceTypes: data.googlePlaceTypes ?? [] },
      new Date(),
    );
    return { success: true };
  },
);
