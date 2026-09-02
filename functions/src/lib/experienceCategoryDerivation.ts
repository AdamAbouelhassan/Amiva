/**
 * Derives a logged experience's `categoryScores` (and `priceLevelAffinity`)
 * from its linked Place's stored Google types + priceLevel — taxonomy
 * migration (2026-09-02): CreateExperienceScreen / EditExperienceScreen no
 * longer collect a manual category rating, so this is the *only* source of
 * truth for what an experience "scores." Called from onExperienceCreated
 * (CLAUDE.md #8 — kept out of the trigger so it's testable against a fake
 * PlaceStore).
 *
 * Reuses `estimateCategoryScoresFromPlace` exactly as Discover >
 * Recommendations does — one implementation, not a fork.
 */
import { estimateCategoryScoresFromPlace, priceLevelToValue, TravelStyleVector } from '@amiva/core';
import { PlaceStore } from './ports';

export interface DerivedExperienceScoring {
  categoryScores: TravelStyleVector;
  /** 0–4, or undefined when the place had no usable Google priceLevel —
   * callers skip the price nudge entirely (never nudge toward 0). */
  priceLevelAffinity: number | undefined;
}

export async function deriveExperienceScoring(
  store: PlaceStore,
  placeId: string,
): Promise<DerivedExperienceScoring> {
  const place = await store.getPlace(placeId);
  return {
    categoryScores: estimateCategoryScoresFromPlace(place.types),
    priceLevelAffinity: priceLevelToValue(place.priceLevel),
  };
}
