/**
 * Travel style decay/adjustment algorithm — technical_specification.md §4.2.
 *
 * Pure functions only; this is executed server-side by Cloud Functions
 * (`onExperienceCreated`, `onSaveCreated`) as the source of truth, per
 * CLAUDE.md principle #2 ("never let client-side computation silently
 * become the source of truth"). The client may call this for instant local
 * preview UI only.
 *
 * Formula (technical_specification.md §4.2):
 *   weight = isLogged ? W_LOGGED : W_SAVED
 *   decayFactor = exp(-λ * daysSinceBaseline)
 *   delta = (experienceVector - currentUserVector) * weight * decayFactor
 *   delta = clamp(delta, -MAX_STEP, MAX_STEP)
 *   newUserVector = currentUserVector + delta
 *
 * Interpretation note (assumption, since the spec names the field but not
 * the exact update rule): `travelStyleLastUpdated` only resets on a manual
 * edit (functional_specification.md §2.4 — "sets a new baseline... does
 * not revert to a prior automatic trend"; technical_specification.md §4.2 —
 * "On a manual edit... travelStyleLastUpdated resets"). Automatic
 * adjustments read `daysSinceBaseline` from that same anchor but do NOT
 * move it, so decay strength is measured relative to the user's last
 * deliberate recalibration, not relative to the previous automatic tick.
 */
import { DecayConfig, DEFAULT_DECAY_CONFIG } from './constants';
import {
  clampTravelStyleVector,
  CATEGORY_IDS,
  TravelStyleVector,
} from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface StyleAdjustmentInput {
  /** The user's current travel style vector before this event. */
  currentVector: TravelStyleVector;
  /** Timestamp of the last baseline reset (manual edit), or account
   * creation if no manual edit has happened yet. */
  travelStyleLastUpdated: Date;
  /** The category profile of the experience being logged or saved. */
  experienceVector: TravelStyleVector;
  /** True for a logged (posted) experience, false for a save. */
  isLogged: boolean;
  /** When the triggering event occurred (usually "now"). */
  eventDate: Date;
  config?: DecayConfig;
  /** Replaces the `isLogged ? config.wLogged : config.wSaved` weight
   * selection entirely when provided — the star-rating-modulated nudge
   * (taxonomy migration, 2026-09-02): a logged event's caller
   * (functions/src/lib/travelStyleUpdate.ts) computes
   * `config.wLogged * getStarRatingMultiplier(rating)` and passes it here,
   * so this function doesn't need to know about star ratings at all — it
   * just applies whatever weight it's given, decayed and capped exactly
   * as before. A save never sets this (saves have no star rating), so its
   * flat `config.wSaved` behavior is unchanged. */
  weightOverride?: number;
}

export interface StyleAdjustmentResult {
  /** The new travel style vector to persist as `travelStyle`. */
  travelStyle: TravelStyleVector;
  /** The per-category delta actually applied (post-cap), useful for
   * logging/debugging and for the unit tests below. */
  delta: TravelStyleVector;
}

export function daysBetween(from: Date, to: Date): number {
  const diff = to.getTime() - from.getTime();
  return Math.max(0, diff / MS_PER_DAY);
}

export function computeStyleAdjustment(input: StyleAdjustmentInput): StyleAdjustmentResult {
  const config = input.config ?? DEFAULT_DECAY_CONFIG;
  const weight = input.weightOverride ?? (input.isLogged ? config.wLogged : config.wSaved);
  const daysSinceBaseline = daysBetween(input.travelStyleLastUpdated, input.eventDate);
  const decayFactor = Math.exp(-config.decayLambda * daysSinceBaseline);

  const delta = {} as TravelStyleVector;
  const travelStyle = {} as TravelStyleVector;

  for (const category of CATEGORY_IDS) {
    const rawDelta =
      (input.experienceVector[category] - input.currentVector[category]) * weight * decayFactor;
    const cappedDelta = Math.min(config.maxStep, Math.max(-config.maxStep, rawDelta));
    delta[category] = cappedDelta;
    travelStyle[category] = input.currentVector[category] + cappedDelta;
  }

  return { travelStyle: clampTravelStyleVector(travelStyle), delta };
}

export interface ManualEditResult {
  travelStyle: TravelStyleVector;
  travelStyleBaseline: TravelStyleVector;
  travelStyleLastUpdated: Date;
}

/** A manual edit in Account Settings sets a new baseline: `travelStyle`
 * and `travelStyleBaseline` both become the manually-entered vector, and
 * `travelStyleLastUpdated` resets to now. Subsequent automatic adjustments
 * compute deltas/decay from this new baseline going forward
 * (functional_specification.md §2.4). */
export function applyManualStyleEdit(newVector: TravelStyleVector, now: Date): ManualEditResult {
  const clamped = clampTravelStyleVector(newVector);
  return {
    travelStyle: clamped,
    travelStyleBaseline: clamped,
    travelStyleLastUpdated: now,
  };
}
