/**
 * Backs `onExperienceCreated` (isLogged=true) and `onSaveCreated`
 * (isLogged=false) — technical_specification.md §5. Both triggers funnel
 * into this one lib function so the decay math (packages/core) is only
 * ever invoked from one place server-side (CLAUDE.md #8).
 *
 * Star-rating-modulated nudge (taxonomy migration, 2026-09-02 —
 * docs/claude_code_prompt_taxonomy_migration.md): a *logged* experience's
 * star rating scales how hard it pulls the logger's own travelStyle — a
 * 1-star experience they hated shouldn't move their style at all; a
 * 5-star one pulls slightly harder than the flat W_LOGGED weight this
 * replaces. This lives here (not in packages/core's computeStyleAdjustment)
 * because it only ever applies to the logged path — a save has no star
 * rating, so `onSaveCreated` keeps calling this with no `starRating` at
 * all, and gets the exact same flat `W_SAVED` behavior as before.
 */
import { computeStyleAdjustment, getStarRatingMultiplier, TravelStyleVector } from '@amiva/core';
import { DecayConfig } from '@amiva/core';
import { UserStore } from './ports';

export interface ApplyExperienceStyleEventInput {
  userId: string;
  experienceVector: TravelStyleVector;
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

  await store.saveAutomaticStyleUpdate(input.userId, travelStyle);
  return travelStyle;
}
