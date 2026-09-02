/**
 * Derives a logged experience's categoryScores from its linked Place's
 * stored Google types — taxonomy migration (2026-09-02, see
 * docs/claude_code_prompt_taxonomy_migration.md): CreateExperienceScreen /
 * EditExperienceScreen no longer collect a manual category rating at all,
 * so this is now the *only* source of truth for what an experience
 * "scores." Called from onExperienceCreated (CLAUDE.md #8 — kept out of
 * the trigger itself so it's testable as a plain function against a fake
 * PlaceStore).
 *
 * Reuses estimateCategoryScoresFromPlace exactly as Discover >
 * Recommendations does — one implementation, not a second one forked for
 * the logging path (explicit instruction in the migration prompt).
 */
import { estimateCategoryScoresFromPlace, TravelStyleVector } from '@amiva/core';
import { PlaceStore } from './ports';

export async function deriveExperienceCategoryScores(store: PlaceStore, placeId: string): Promise<TravelStyleVector> {
  const types = await store.getPlaceTypes(placeId);
  return estimateCategoryScoresFromPlace(types);
}
