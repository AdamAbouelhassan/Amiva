/**
 * `priceLevelAffinity` — a single 0–4 scalar for *how upscale* a user likes
 * their travel experiences, independent of *what kind* (taxonomy-reduction
 * pass, 2026-09-02). Modeled in parallel with `travelStyle`: same decay /
 * `W_LOGGED` / `W_SAVED` / star-rating-multiplier machinery, nudged from the
 * same events, anchored to the same `travelStyleLastUpdated` baseline — but
 * deliberately **kept out of `matchScorer.ts`'s cosine similarity** (a 0–4
 * ordinal price scale mixed into the category-weight vector would need its
 * own normalization story and would silently change the meaning of the
 * existing match %). It's an independent number surfaced separately (a
 * "budget fit" indicator), not a 10th `CategoryId`.
 */
import { DecayConfig, DEFAULT_DECAY_CONFIG, PRICE_LEVEL_VALUES, clampPriceAffinity } from './constants';
import { daysBetween } from './travelStyleDecay';

/** Google Places (New) `priceLevel` enum string → 0–4, or `undefined` when
 * there's no usable signal (`PRICE_LEVEL_UNSPECIFIED`, an unknown value, or
 * the field absent entirely — common for parks / nature / much of culture).
 * Callers treat `undefined` as "skip the nudge", never as 0. */
export function priceLevelToValue(priceLevel?: string | null): number | undefined {
  if (!priceLevel) return undefined;
  const value = PRICE_LEVEL_VALUES[priceLevel];
  return value === undefined ? undefined : value;
}

export interface PriceAffinityAdjustmentInput {
  /** The user's current priceLevelAffinity (0–4). */
  current: number;
  /** Same baseline anchor as the travelStyle decay — a manual style edit
   * resets both together. */
  travelStyleLastUpdated: Date;
  /** The 0–4 price value of the experience being logged/saved. */
  experienceValue: number;
  isLogged: boolean;
  eventDate: Date;
  config?: DecayConfig;
  /** Replaces the `isLogged ? wLogged : wSaved` weight entirely — the
   * logged path passes `wLogged * getStarRatingMultiplier(rating)`, exactly
   * as computeStyleAdjustment's `weightOverride` does for the vector. */
  weightOverride?: number;
}

/** The scalar analog of `computeStyleAdjustment` — identical formula
 * (`delta = (experienceValue - current) * weight * exp(-λ·days)`, capped at
 * ±MAX_STEP), applied to one number instead of a vector. */
export function computePriceAffinityAdjustment(input: PriceAffinityAdjustmentInput): {
  priceLevelAffinity: number;
  delta: number;
} {
  const config = input.config ?? DEFAULT_DECAY_CONFIG;
  const weight = input.weightOverride ?? (input.isLogged ? config.wLogged : config.wSaved);
  const daysSinceBaseline = daysBetween(input.travelStyleLastUpdated, input.eventDate);
  const decayFactor = Math.exp(-config.decayLambda * daysSinceBaseline);

  const rawDelta = (input.experienceValue - input.current) * weight * decayFactor;
  const delta = Math.min(config.maxStep, Math.max(-config.maxStep, rawDelta));

  return { priceLevelAffinity: clampPriceAffinity(input.current + delta), delta };
}

/**
 * Bayesian-adjusted crowd rating — pulls a rating toward a global prior in
 * proportion to how few reviews back it, so a 5.0 from 3 reviews doesn't
 * outrank a 4.6 from 3,000: `(count·rating + priorWeight·priorMean) /
 * (count + priorWeight)`.
 *
 * DEFERRED WIRING (taxonomy-reduction pass): `rating` / `userRatingCount`
 * are stored on `places/{id}` now, and this helper exists + is tested, but
 * it is **not yet used** in feed/Discovery ranking — the exact weight a
 * rating gap should carry as a tiebreaker needs real usage data, not a
 * guess (prompt's "Ask me before"). `priorMean` / `priorWeight` here are
 * placeholders.
 */
export function bayesianRating(
  rating: number | undefined,
  count: number | undefined,
  priorMean = 3.8,
  priorWeight = 50,
): number {
  const r = typeof rating === 'number' ? rating : priorMean;
  const n = typeof count === 'number' && count > 0 ? count : 0;
  return (n * r + priorWeight * priorMean) / (n + priorWeight);
}
