/**
 * Backs `onExperienceCreated` (isLogged=true) and `onSaveCreated`
 * (isLogged=false) — technical_specification.md §5. Both triggers funnel
 * into this one lib function so the decay math (packages/core) is only
 * ever invoked from one place server-side (CLAUDE.md #8).
 *
 * Star-rating-modulated nudge (taxonomy migration, 2026-09-02): a *logged*
 * experience's star rating scales how hard it pulls the logger's own
 * travelStyle — 1 star doesn't move it, 5 stars pull slightly harder than
 * the flat W_LOGGED weight. Logged path only (a save has no star rating).
 *
 * priceLevelAffinity nudge (taxonomy-reduction pass, 2026-09-02): the same
 * decay / weight / star-multiplier math is applied *in parallel* to the
 * user's scalar `priceLevelAffinity`, anchored to the same
 * `travelStyleLastUpdated` baseline — but kept out of `matchScorer.ts`.
 * Skipped entirely when the experience has no price signal.
 */
import {
  computePriceAffinityAdjustment,
  computeStyleAdjustment,
  DecayConfig,
  getStarRatingMultiplier,
  PRICE_AFFINITY_NEUTRAL,
  TravelStyleVector,
} from '@amiva/core';
import { UserStore } from './ports';

export interface ApplyExperienceStyleEventInput {
  userId: string;
  experienceVector: TravelStyleVector;
  /** The experience's 0–4 price value, or undefined when the place had no
   * Google priceLevel — omit to skip the price nudge (never nudge to 0). */
  experiencePriceAffinity?: number;
  isLogged: boolean;
  eventDate: Date;
  decayConfig: DecayConfig;
  /** The experience's 1-5 star rating. Only meaningful (and only ever
   * passed) for the logged path — omit entirely for a save. */
  starRating?: number;
  /** Resolved (possibly Firestore-overridden) STAR_RATING_MULTIPLIER —
   * see remoteConfig.ts's resolveScoringConfig. Falls back to the
   * @amiva/core default table when omitted. */
  starRatingMultiplier?: Record<1 | 2 | 3 | 4 | 5, number>;
}

export async function applyExperienceStyleEvent(
  store: UserStore,
  input: ApplyExperienceStyleEventInput,
): Promise<TravelStyleVector> {
  const current = await store.getUserStyle(input.userId);

  const weightOverride =
    input.isLogged && input.starRating !== undefined
      ? input.decayConfig.wLogged * getStarRatingMultiplier(input.starRating, input.starRatingMultiplier)
      : undefined;

  const { travelStyle } = computeStyleAdjustment({
    currentVector: current.travelStyle,
    travelStyleLastUpdated: current.travelStyleLastUpdated,
    experienceVector: input.experienceVector,
    isLogged: input.isLogged,
    eventDate: input.eventDate,
    config: input.decayConfig,
    weightOverride,
  });

  let priceLevelAffinity: number | undefined;
  if (typeof input.experiencePriceAffinity === 'number') {
    priceLevelAffinity = computePriceAffinityAdjustment({
      current: current.priceLevelAffinity ?? PRICE_AFFINITY_NEUTRAL,
      travelStyleLastUpdated: current.travelStyleLastUpdated,
      experienceValue: input.experiencePriceAffinity,
      isLogged: input.isLogged,
      eventDate: input.eventDate,
      config: input.decayConfig,
      weightOverride,
    }).priceLevelAffinity;
  }

  await store.saveAutomaticStyleUpdate(input.userId, { travelStyle, priceLevelAffinity });
  return travelStyle;
}
