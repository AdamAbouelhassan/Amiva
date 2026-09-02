/**
 * technical_specification.md §5: "Recompute owner's travel style (logged
 * weight); update trip aggregate; check for trending signal."
 *
 * Taxonomy migration (2026-09-02): categoryScores is no longer trusted
 * from client input at all — CreateExperienceScreen/EditExperienceScreen
 * dropped the manual category-slider step, so there's no client-computed
 * value to trust in the first place. This trigger now derives it itself
 * from the linked Place's stored Google types
 * (lib/experienceCategoryDerivation.ts) and writes it back onto the
 * experience doc — the create-time doc a client writes carries a zero-
 * vector placeholder (see ExperienceRepository.create client-side) that
 * this immediately corrects, the same "create now, backfill a moment
 * later" shape this trigger already used for the trip cover photo below.
 *
 * Trending itself is computed on-read by `getTrending` (see
 * lib/trending.ts's header comment for why no extra write happens here) —
 * this trigger's job is the category derivation, the style update, and
 * the trip cover-photo default.
 */
import * as functions from 'firebase-functions/v1';
import { FirestoreConfigStore } from '../adapters/configAdapter';
import { FirestorePlaceStore } from '../adapters/placeAdapter';
import { FirestoreTripStore } from '../adapters/tripAdapter';
import { FirestoreUserStore } from '../adapters/userAdapter';
import { deriveExperienceScoring } from '../lib/experienceCategoryDerivation';
import { applyExperienceStyleEvent } from '../lib/travelStyleUpdate';
import { maybeSetTripCoverPhoto } from '../lib/tripCoverPhoto';
import { resolveScoringConfig } from '../lib/remoteConfig';

export const onExperienceCreated = functions.firestore
  .document('experiences/{experienceId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const now = new Date();

    const config = await resolveScoringConfig(new FirestoreConfigStore());

    const { categoryScores, priceLevelAffinity } = await deriveExperienceScoring(
      new FirestorePlaceStore(),
      data.placeId,
    );
    await snap.ref.update(
      priceLevelAffinity === undefined ? { categoryScores } : { categoryScores, priceLevelAffinity },
    );

    await applyExperienceStyleEvent(new FirestoreUserStore(), {
      userId: data.ownerId,
      experienceVector: categoryScores,
      experiencePriceAffinity: priceLevelAffinity,
      isLogged: true,
      eventDate: now,
      decayConfig: config.decay,
      starRating: data.rating,
      starRatingMultiplier: config.starRatingMultiplier,
    });

    if (data.tripId) {
      await maybeSetTripCoverPhoto(new FirestoreTripStore(), data.tripId, data.photoUrls ?? []);
    }
  });
