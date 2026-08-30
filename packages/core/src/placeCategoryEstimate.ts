/**
 * Estimates a TravelStyleVector for a raw Google Place (Discovery >
 * Recommendations) from its Places API metadata, so an unvisited place can
 * flow through the same defaultMatchScorer everyone else uses instead of
 * needing a second scoring mechanism (Discover rebuild, 2026-08-30 — "the
 * difficulty here will be finding associated metadata that we can
 * translate into our standard travel style scoring procedure").
 *
 * This is a hand-authored heuristic over Google's place-type taxonomy
 * (https://developers.google.com/maps/documentation/places/web-service/place-types),
 * not a measured signal — tune the weight table as real usage shows it's
 * off, the same way MAX_STEP/λ in constants.ts are expected to be tuned.
 */
import {
  clampTravelStyleVector,
  TRAVEL_STYLE_CATEGORIES,
  TravelStyleCategory,
  TravelStyleVector,
  zeroTravelStyleVector,
} from './types';

/** Weight each Google Place `type` contributes toward each of the 8
 * categories, on the same 0-10 scale a manually-scored experience uses.
 * Only types with a clear travel-style signal are listed — generic Google
 * types (`point_of_interest`, `establishment`, `premise`, ...) carry no
 * signal and are intentionally omitted so they don't dilute the estimate
 * (see estimateCategoryScoresFromPlace). */
export const GOOGLE_PLACE_TYPE_WEIGHTS: Record<string, Partial<TravelStyleVector>> = {
  // Culture
  museum: { culture: 9 },
  art_gallery: { culture: 8 },
  historical_landmark: { culture: 8 },
  tourist_attraction: { culture: 6, adventure: 3 },
  place_of_worship: { culture: 7 },
  church: { culture: 7 },
  mosque: { culture: 7 },
  synagogue: { culture: 7 },
  hindu_temple: { culture: 7 },
  performing_arts_theater: { culture: 8 },
  monument: { culture: 7 },

  // Foodie
  restaurant: { foodie: 8 },
  cafe: { foodie: 5, relaxation: 3 },
  bakery: { foodie: 6 },
  food_court: { foodie: 6 },
  market: { foodie: 4, culture: 4, budgetBackpacker: 4 },
  wine_bar: { foodie: 6, luxury: 5 },

  // Social / Nightlife
  bar: { socialNightlife: 8, foodie: 2 },
  night_club: { socialNightlife: 9, luxury: 3 },
  casino: { socialNightlife: 6, luxury: 6 },
  stadium: { socialNightlife: 5, adventure: 3 },

  // Relaxation
  spa: { relaxation: 9, luxury: 5 },
  beach: { relaxation: 7, nature: 6 },
  resort_hotel: { relaxation: 6, luxury: 6 },

  // Nature / Adventure
  park: { nature: 7, relaxation: 4 },
  national_park: { nature: 9, adventure: 5 },
  hiking_area: { adventure: 8, nature: 9 },
  campground: { nature: 8, budgetBackpacker: 7, adventure: 5 },
  amusement_park: { adventure: 7, socialNightlife: 3 },
  water_park: { adventure: 6, nature: 3 },
  zoo: { nature: 6, culture: 3 },
  aquarium: { nature: 5, culture: 4 },
  wildlife_park: { nature: 8, adventure: 5 },
  ski_resort: { adventure: 7, nature: 6, luxury: 5 },

  // Luxury
  shopping_mall: { luxury: 4, socialNightlife: 2 },
  jewelry_store: { luxury: 6 },

  // Budget / Backpacker
  hostel: { budgetBackpacker: 9 },
  bus_station: { budgetBackpacker: 4 },
};

/** `price_level` (Google's 0-4 scale) is a secondary signal layered on top
 * of the type-based estimate: pricier places nudge luxury up and
 * budgetBackpacker down, and vice versa, rather than driving the estimate
 * on their own. */
function priceLevelAdjustment(priceLevel: number | undefined): Partial<TravelStyleVector> {
  if (priceLevel === undefined) return {};
  if (priceLevel >= 3) return { luxury: 2 * (priceLevel - 2) };
  if (priceLevel <= 1) return { budgetBackpacker: 2 * (1 - priceLevel) };
  return {};
}

/** Blends the weight vectors of every recognized type on a place (a place
 * commonly has several, e.g. `["night_club", "bar", "point_of_interest"]`)
 * into one TravelStyleVector, then layers in the price-level adjustment.
 * Types with no entry in GOOGLE_PLACE_TYPE_WEIGHTS are ignored rather than
 * treated as a zero vote, so an unrecognized/generic type doesn't dilute
 * the average toward zero. Returns the zero vector if nothing matched. */
export function estimateCategoryScoresFromPlace(types: string[], priceLevel?: number): TravelStyleVector {
  const matched = types
    .map((type) => GOOGLE_PLACE_TYPE_WEIGHTS[type])
    .filter((weights): weights is Partial<TravelStyleVector> => !!weights);

  const sum = zeroTravelStyleVector();
  for (const weights of matched) {
    for (const category of TRAVEL_STYLE_CATEGORIES) {
      sum[category] += weights[category] ?? 0;
    }
  }

  const adjustment = priceLevelAdjustment(priceLevel);
  const result = zeroTravelStyleVector();
  for (const category of TRAVEL_STYLE_CATEGORIES) {
    const base = matched.length > 0 ? sum[category] / matched.length : 0;
    result[category] = base + (adjustment[category] ?? 0);
  }

  return clampTravelStyleVector(result);
}

/** The reverse direction: given a TravelStyleCategory filter chosen in the
 * Recommendations UI, a representative Google Place `type` (for the Places
 * Text Search `type` param) and a plain-language keyword (folded into the
 * search query text alongside city/country) — hand-picked for relevance
 * rather than mechanically inverting the weight table above (many types
 * feed several categories; the representative pick here is whichever
 * type/keyword best characterizes that category on its own). */
export const CATEGORY_SEARCH_HINTS: Record<TravelStyleCategory, { googleType: string; keyword: string }> = {
  adventure: { googleType: 'hiking_area', keyword: 'adventure activities' },
  luxury: { googleType: 'resort_hotel', keyword: 'luxury experiences' },
  culture: { googleType: 'museum', keyword: 'cultural sites' },
  foodie: { googleType: 'restaurant', keyword: 'food' },
  relaxation: { googleType: 'spa', keyword: 'relaxation' },
  socialNightlife: { googleType: 'night_club', keyword: 'nightlife' },
  nature: { googleType: 'park', keyword: 'nature' },
  budgetBackpacker: { googleType: 'hostel', keyword: 'budget travel' },
};
