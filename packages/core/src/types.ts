/**
 * Core domain types for the Amiva travel style model.
 *
 * Taxonomy migration (2026-09-02, see
 * docs/claude_code_prompt_taxonomy_migration.md): the category set is now
 * Google Places' own 19 top-level categories (data/googlePlacesCategories.json)
 * instead of 8 hand-picked ones. `CATEGORY_IDS` is still a hand-typed literal
 * tuple — TypeScript can't derive a string-literal union from an imported
 * JSON file's contents (`resolveJsonModule` widens JSON string fields to
 * `string`), so a closed key set has to be declared in source somewhere.
 * This is that one place; `__tests__/categoryIds.test.ts` asserts it stays
 * byte-for-byte in sync with googlePlacesCategories.json's `id` values (in
 * order) as the actual source of truth for spelling/casing, so this array
 * is never hand-retyped from memory again after this migration.
 */

/** The 19 fixed MVP travel style categories (Google Places' own top-level
 * groupings), in a stable, canonical order matching
 * data/googlePlacesCategories.json. Order matters: it defines vector-index
 * alignment for cosine similarity. Not user-extensible for MVP. */
export const CATEGORY_IDS = [
  'automotive',
  'business',
  'culture',
  'education',
  'entertainment_and_recreation',
  'facilities',
  'finance',
  'food_and_drink',
  'geographical_areas',
  'government',
  'health_and_wellness',
  'housing',
  'lodging',
  'natural_features',
  'places_of_worship',
  'services',
  'shopping',
  'sports',
  'transportation',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

/** One score per category, each on a continuous 0–10 scale. A closed,
 * fixed key set (`Record` over the literal `CategoryId` union, not an open
 * `Record<string, number>`) — same guarantee the old 8-property interface
 * gave, just expressed as a map instead of 19 hand-typed properties, since
 * hand-typing 19 properties and keeping them in sync with the category
 * list is exactly the kind of drift this migration avoids. */
export type TravelStyleVector = Record<CategoryId, number>;

/** Inclusive bounds for an individual category score. Assumption: the spec
 * says "0-10" for the scale but doesn't explicitly state whether decay-
 * adjusted values must stay clamped in range; we clamp defensively so the
 * vector always stays valid input for sliders/radar charts/cosine math. */
export const CATEGORY_MIN = 0;
export const CATEGORY_MAX = 10;

export function clampCategoryValue(value: number): number {
  if (Number.isNaN(value)) return CATEGORY_MIN;
  return Math.min(CATEGORY_MAX, Math.max(CATEGORY_MIN, value));
}

export function clampTravelStyleVector(vector: TravelStyleVector): TravelStyleVector {
  const result = {} as TravelStyleVector;
  for (const category of CATEGORY_IDS) {
    result[category] = clampCategoryValue(vector[category]);
  }
  return result;
}

/** A zero vector — useful as a default/initial state before onboarding,
 * and as the create-time placeholder for an experience's categoryScores
 * before the server derives the real value (see travelStyleUpdate.ts). */
export function zeroTravelStyleVector(): TravelStyleVector {
  const result = {} as TravelStyleVector;
  for (const category of CATEGORY_IDS) {
    result[category] = 0;
  }
  return result;
}
