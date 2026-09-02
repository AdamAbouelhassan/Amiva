/**
 * Estimates a TravelStyleVector for a Google Place from its `types[]`
 * (Places API `types`/`primaryType`), so a place can flow through the
 * same defaultMatchScorer everyone else uses instead of needing a second
 * scoring mechanism. Used for both an unvisited Discover > Recommendations
 * place, and — post taxonomy migration (2026-09-02, see
 * docs/claude_code_prompt_taxonomy_migration.md) — for a *logged*
 * experience's categoryScores, computed server-side from the linked
 * Place's stored types (functions/src/lib/travelStyleUpdate.ts). One
 * function, reused for both, per the migration prompt's explicit
 * instruction not to fork a second implementation.
 *
 * Two-tier design:
 *  - Default rule: an unlisted type's weight is `{ [type.category]:
 *    CATEGORY_MAX }` (full weight on the category Google's own Table A
 *    already assigns it). Covers all types with zero manual effort. On the
 *    same 0–CATEGORY_MAX (0–5, 2026-09-03) scale as a slider value / the
 *    decay math — mismatched scales would make experienceVector's
 *    contribution rounding-error-sized next to currentVector's.
 *  - Override table (CATEGORY_WEIGHT_OVERRIDES): weights are the migration
 *    prompt's illustration ratios (fractions of 1) scaled onto the 0–5
 *    scale — e.g. a 0.6/0.4 split is `3/2`. They don't need to sum to
 *    anything; only the ratio between an entry's categories matters (and
 *    that each stays ≤ CATEGORY_MAX so nothing clamps and distorts it).
 *  - Override table (CATEGORY_WEIGHT_OVERRIDES): a curated exception list
 *    for types that genuinely span two (or three) categories for a
 *    *traveler's* purposes even though Google files them under only one.
 *    Every entry carries a one-line rationale (migration prompt
 *    convention). Restaurants/lodging/culture/entertainment/sports/
 *    nature/nightlife/wellness are the categories worth this attention
 *    per the migration prompt — a traveler rarely logs a car_wash or an
 *    ATM as an experience, so the mechanical default is left alone for
 *    Automotive/Business/Education/Facilities/Finance/Geographical Areas/
 *    Government/Housing/Places of Worship/Services/Shopping/
 *    Transportation.
 *
 * Dropped from the pre-migration version: the old price_level-based
 * luxury/budgetBackpacker nudge. Both of those were category axes in the
 * 8-category model; neither exists in the new 19 (which are all activity
 * types, not price tiers — a luxury restaurant and a budget one are both
 * still just `food_and_drink`). There's no principled category left to
 * nudge, so `priceLevel` is no longer accepted here — a direct, mechanical
 * consequence of the category-set change, not a new judgment call.
 */
import { getCategoryForType } from './googlePlaceTaxonomy';
import {
  CATEGORY_IDS,
  CATEGORY_MAX,
  CategoryId,
  clampTravelStyleVector,
  TravelStyleVector,
  zeroTravelStyleVector,
} from './types';

/** Curated exceptions to the default single-category-at-full-weight rule.
 * Weights are on the 0–5 scale (see header) — only the ratio within an
 * entry matters. */
export const CATEGORY_WEIGHT_OVERRIDES: Partial<Record<string, Partial<Record<CategoryId, number>>>> = {
  // --- starter set, migration prompt §"The type → category weight table" ---
  historical_landmark: { entertainment_and_recreation: 3, culture: 2 },
  beer_garden: { food_and_drink: 3.5, entertainment_and_recreation: 1.5 },
  indoor_playground: { entertainment_and_recreation: 2.5, sports: 2.5 },
  miniature_golf_course: { entertainment_and_recreation: 3, sports: 2 },
  vineyard: { entertainment_and_recreation: 2.5, food_and_drink: 2.5 },
  winery: { food_and_drink: 3.5, entertainment_and_recreation: 1.5 },
  // (`tourist_information_center` override removed — `services` category was
  // cut in the taxonomy-reduction pass, and the type with it.)

  // --- places of worship: only landmarked ones reach this function (the
  // ingestion gate drops non-landmark parishes), and a landmark temple/
  // cathedral/mosque is as much a Culture visit as a devotional one. ---
  church: { places_of_worship: 2.5, culture: 2.5 }, // landmark churches read as much as a Culture visit as a devotional one
  mosque: { places_of_worship: 2.5, culture: 2.5 }, // same reasoning as church
  synagogue: { places_of_worship: 2.5, culture: 2.5 }, // same reasoning as church
  hindu_temple: { places_of_worship: 2.5, culture: 2.5 }, // same reasoning as church
  buddhist_temple: { places_of_worship: 2.5, culture: 2.5 }, // same reasoning as church
  shinto_shrine: { places_of_worship: 2.5, culture: 2.5 }, // same reasoning as church

  // --- food & drink: venues where the experience/nightlife half is as real as the food ---
  wine_bar: { food_and_drink: 3.5, entertainment_and_recreation: 1.5 }, // a tasting/social venue, not just a meal
  cocktail_bar: { food_and_drink: 3, entertainment_and_recreation: 2 }, // trades on atmosphere as much as the drink
  brewery: { food_and_drink: 3, entertainment_and_recreation: 2 }, // tours/tastings are the draw as much as the beer
  brewpub: { food_and_drink: 3.5, entertainment_and_recreation: 1.5 },
  tea_house: { food_and_drink: 3, culture: 2 }, // tea ceremony/culture is often the point of visiting
  fine_dining_restaurant: { food_and_drink: 4, culture: 1 }, // upscale dining reads partly as a cultural outing

  // --- lodging: places that are a destination in themselves, not just where you sleep ---
  resort_hotel: { lodging: 3, entertainment_and_recreation: 2 }, // amenities/activities are why you book it
  campground: { lodging: 2, natural_features: 2, entertainment_and_recreation: 1 }, // camping is an activity, not just accommodation
  camping_cabin: { lodging: 2.5, natural_features: 1.5, entertainment_and_recreation: 1 },
  farmstay: { lodging: 2.5, natural_features: 1.5, entertainment_and_recreation: 1 }, // agritourism, not a plain overnight stay

  // --- culture: sites that are equally "things to go do" ---
  castle: { culture: 3, entertainment_and_recreation: 2 },
  cultural_landmark: { culture: 3, entertainment_and_recreation: 2 },
  historical_place: { culture: 3, entertainment_and_recreation: 2 },

  // --- performance venues that are as much culture as "a night out" ---
  opera_house: { entertainment_and_recreation: 2.5, culture: 2.5 },
  concert_hall: { entertainment_and_recreation: 2.5, culture: 2.5 },
  philharmonic_hall: { entertainment_and_recreation: 2.5, culture: 2.5 },

  // --- nightlife (no longer its own category — folded into entertainment_and_recreation/food_and_drink) ---
  night_club: { entertainment_and_recreation: 3.5, food_and_drink: 1.5 }, // dancing/DJ is the draw, drinks secondary
  casino: { entertainment_and_recreation: 3.5, food_and_drink: 1.5 },
  karaoke: { entertainment_and_recreation: 3.5, food_and_drink: 1.5 },

  // --- entertainment_and_recreation types (per Google) that are genuinely nature/sports experiences ---
  national_park: { entertainment_and_recreation: 2.5, natural_features: 2.5 }, // it's the nature that draws travelers
  hiking_area: { entertainment_and_recreation: 1.5, natural_features: 2, sports: 1.5 },
  botanical_garden: { entertainment_and_recreation: 2.5, natural_features: 2.5 },
  wildlife_park: { entertainment_and_recreation: 3, natural_features: 2 },
  wildlife_refuge: { entertainment_and_recreation: 2, natural_features: 3 }, // more conservation/observation than staged entertainment
  zoo: { entertainment_and_recreation: 3.5, natural_features: 1.5 },
  aquarium: { entertainment_and_recreation: 3.5, natural_features: 1.5 },
  water_park: { entertainment_and_recreation: 3.5, sports: 1.5 }, // genuinely physical, not passive entertainment

  // --- sports: venues that are as much spectator entertainment (or lodging/nature) as athletics ---
  stadium: { sports: 2.5, entertainment_and_recreation: 2.5 },
  arena: { sports: 2.5, entertainment_and_recreation: 2.5 },
  ski_resort: { sports: 2, natural_features: 2, lodging: 1 }, // often booked/experienced as a lodging+nature destination
  golf_course: { sports: 4, natural_features: 1 },

  // --- natural features: also the primary leisure activity, not just scenery ---
  beach: { natural_features: 3, entertainment_and_recreation: 2 }, // swimming/lounging is an activity
  scenic_spot: { natural_features: 3.5, entertainment_and_recreation: 1.5 },

  // --- health & wellness: booked as a leisure activity, not medical care ---
  spa: { health_and_wellness: 3, entertainment_and_recreation: 2 },
  massage_spa: { health_and_wellness: 3, entertainment_and_recreation: 2 },
  sauna: { health_and_wellness: 3, entertainment_and_recreation: 2 },
  yoga_studio: { health_and_wellness: 3.5, entertainment_and_recreation: 1.5 },
  wellness_center: { health_and_wellness: 3, entertainment_and_recreation: 2 },
};

/** The weight vector a single Google place `type` contributes: the
 * override table if the type is listed there, otherwise the default rule
 * (full weight on Google's own Table A category for that type), or
 * `undefined` for a type this snapshot doesn't recognize at all. */
function weightForType(type: string): Partial<TravelStyleVector> | undefined {
  const override = CATEGORY_WEIGHT_OVERRIDES[type];
  if (override) return override;

  const category = getCategoryForType(type);
  if (!category) return undefined; // unknown type — see estimateCategoryScoresFromPlace

  return { [category]: CATEGORY_MAX };
}

/** Blends the weight vectors of every recognized type on a place (a place
 * commonly has several, e.g. `["night_club", "bar", "point_of_interest"]`)
 * into one TravelStyleVector by averaging. A type unrecognized by this
 * snapshot (Google added it after data/googlePlacesTypes.json was
 * captured, or it's a generic type like `point_of_interest`/
 * `establishment` with no taxonomy entry at all) is skipped rather than
 * treated as a zero vote, so it doesn't dilute the estimate toward zero.
 * Returns the zero vector if nothing matched. */
export function estimateCategoryScoresFromPlace(types: string[]): TravelStyleVector {
  const matched = types.map(weightForType).filter((weights): weights is Partial<TravelStyleVector> => !!weights);

  const sum = zeroTravelStyleVector();
  for (const weights of matched) {
    for (const category of CATEGORY_IDS) {
      sum[category] += weights[category] ?? 0;
    }
  }

  const result = zeroTravelStyleVector();
  for (const category of CATEGORY_IDS) {
    result[category] = matched.length > 0 ? sum[category] / matched.length : 0;
  }

  return clampTravelStyleVector(result);
}

/** The reverse direction: given a CategoryId filter chosen in the
 * Recommendations UI, a representative Google Place `type` (for the
 * Places Text Search `type` param) and a plain-language keyword (folded
 * into the search query text alongside city/country). Hand-picked for
 * relevance rather than mechanically inverting the weight table above
 * (many types feed several categories; the representative pick here is
 * whichever type/keyword best characterizes that category on its own).
 * One entry per CategoryId — CATEGORY_SEARCH_HINTS.test.ts asserts full
 * coverage. */
export const CATEGORY_SEARCH_HINTS: Record<CategoryId, { googleType: string; keyword: string }> = {
  culture: { googleType: 'museum', keyword: 'cultural sites' },
  entertainment_and_recreation: { googleType: 'tourist_attraction', keyword: 'things to do' },
  food_and_drink: { googleType: 'restaurant', keyword: 'food' },
  health_and_wellness: { googleType: 'spa', keyword: 'wellness and spas' },
  lodging: { googleType: 'hotel', keyword: 'places to stay' },
  natural_features: { googleType: 'scenic_spot', keyword: 'nature and scenery' },
  // Layer 1 can only filter this category by type — the landmark condition
  // is a Layer 2 (ingestion) concern, so a search scoped here still returns
  // non-landmark churches; placeGate.isApprovedPlace drops them.
  places_of_worship: { googleType: 'church', keyword: 'landmark temples and cathedrals' },
  shopping: { googleType: 'shopping_mall', keyword: 'shopping' },
  sports: { googleType: 'stadium', keyword: 'sports' },
};
