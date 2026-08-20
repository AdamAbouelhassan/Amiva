/**
 * Core domain types for the Amiva travel style model.
 *
 * Per technical_specification.md §3.1 — this is the single definition of
 * TravelStyleVector and the 8 fixed categories. Both /apps/mobile and
 * /functions import this rather than redefining it (CLAUDE.md "DRY on
 * types and constants").
 */

/** The 8 fixed MVP travel style categories, in a stable, canonical order.
 * Order matters: it defines vector-index alignment for cosine similarity
 * and axis order for the shared RadarChart component. Not user-extensible
 * for MVP (functional_specification.md §2.1). */
export const TRAVEL_STYLE_CATEGORIES = [
  'adventure',
  'luxury',
  'culture',
  'foodie',
  'relaxation',
  'socialNightlife',
  'nature',
  'budgetBackpacker',
] as const;

export type TravelStyleCategory = (typeof TRAVEL_STYLE_CATEGORIES)[number];

/** One score per category, each on a continuous 0–10 scale
 * (technical_specification.md §3.1). */
export type TravelStyleVector = {
  [K in TravelStyleCategory]: number;
};

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
  for (const category of TRAVEL_STYLE_CATEGORIES) {
    result[category] = clampCategoryValue(vector[category]);
  }
  return result;
}

/** A zero vector — useful as a default/initial state before onboarding. */
export function zeroTravelStyleVector(): TravelStyleVector {
  const result = {} as TravelStyleVector;
  for (const category of TRAVEL_STYLE_CATEGORIES) {
    result[category] = 0;
  }
  return result;
}
