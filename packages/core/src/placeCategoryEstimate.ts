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
 *  - Default rule: an unlisted type's weight is `{ [type.category]: 10 }`
 *    (full weight on the category Google's own Table A already assigns
 *    it — data/googlePlacesTypes.json via googlePlaceTaxonomy.ts). Covers
 *    all ~477 types with zero manual effort. 10, not 1.0, to stay on the
 *    same 0-10 scale everything else in the codebase uses (a manually
 *    entered slider value, `CATEGORY_MIN`/`CATEGORY_MAX`, the decay math
 *    in travelStyleDecay.ts) — the migration prompt's own override
 *    numbers are given as fractions summing to 1.0 for illustration; the
 *    table below is that same *ratio*, scaled by 10, so a 0.6/0.4 split
 *    becomes 6/4. Absolute scale doesn't matter for cosine similarity,
 *    but it matters a great deal for computeStyleAdjustment's decay
 *    delta, which subtracts this vector directly against a 0-10-scale
 *    user vector — mismatched scales would make experienceVector's
 *    contribution rounding-error-sized next to currentVector's.
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
import { CATEGORY_IDS, CategoryId, clampTravelStyleVector, TravelStyleVector, zeroTravelStyleVector } from './types';

/** Curated exceptions to the default 1-category-at-full-weight rule.
 * Weights are on the same 0-10 scale as everything else (see header) —
 * not required to sum to 10 per entry, just relative to each other. */
export const CATEGORY_WEIGHT_OVERRIDES: Partial<Record<string, Partial<Record<CategoryId, number>>>> = {
  // --- starter set, migration prompt §"The type → category weight table" ---
  historical_landmark: { entertainment_and_recreation: 6, culture: 4 },
  beer_garden: { food_and_drink: 7, entertainment_and_recreation: 3 },
  indoor_playground: { entertainment_and_recreation: 5, sports: 5 },
  miniature_golf_course: { entertainment_and_recreation: 6, sports: 4 },
  vineyard: { entertainment_and_recreation: 5, food_and_drink: 5 },
  winery: { food_and_drink: 7, entertainment_and_recreation: 3 },
  tourist_information_center: { services: 3, entertainment_and_recreation: 7 },

  // --- food & drink: venues where the experience/nightlife half is as real as the food ---
  wine_bar: { food_and_drink: 7, entertainment_and_recreation: 3 }, // a tasting/social venue, not just a meal
  cocktail_bar: { food_and_drink: 6, entertainment_and_recreation: 4 }, // trades on atmosphere as much as the drink
  brewery: { food_and_drink: 6, entertainment_and_recreation: 4 }, // tours/tastings are the draw as much as the beer
  brewpub: { food_and_drink: 7, entertainment_and_recreation: 3 },
  tea_house: { food_and_drink: 6, culture: 4 }, // tea ceremony/culture is often the point of visiting
  fine_dining_restaurant: { food_and_drink: 8, culture: 2 }, // upscale dining reads partly as a cultural outing

  // --- lodging: places that are a destination in themselves, not just where you sleep ---
  resort_hotel: { lodging: 6, entertainment_and_recreation: 4 }, // amenities/activities are why you book it
  campground: { lodging: 4, natural_features: 4, entertainment_and_recreation: 2 }, // camping is an activity, not just accommodation
  camping_cabin: { lodging: 5, natural_features: 3, entertainment_and_recreation: 2 },
  farmstay: { lodging: 5, natural_features: 3, entertainment_and_recreation: 2 }, // agritourism, not a plain overnight stay

  // --- culture: sites that are equally "things to go do" ---
  castle: { culture: 6, entertainment_and_recreation: 4 },
  cultural_landmark: { culture: 6, entertainment_and_recreation: 4 },
  historical_place: { culture: 6, entertainment_and_recreation: 4 },

  // --- performance venues that are as much culture as "a night out" ---
  opera_house: { entertainment_and_recreation: 5, culture: 5 },
  concert_hall: { entertainment_and_recreation: 5, culture: 5 },
  philharmonic_hall: { entertainment_and_recreation: 5, culture: 5 },

  // --- nightlife (no longer its own category — folded into entertainment_and_recreation/food_and_drink) ---
  night_club: { entertainment_and_recreation: 7, food_and_drink: 3 }, // dancing/DJ is the draw, drinks secondary
  casino: { entertainment_and_recreation: 7, food_and_drink: 3 },
  karaoke: { entertainment_and_recreation: 7, food_and_drink: 3 },

  // --- entertainment_and_recreation types (per Google) that are genuinely nature/sports experiences ---
  national_park: { entertainment_and_recreation: 5, natural_features: 5 }, // it's the nature that draws travelers
  hiking_area: { entertainment_and_recreation: 3, natural_features: 4, sports: 3 },
  botanical_garden: { entertainment_and_recreation: 5, natural_features: 5 },
  wildlife_park: { entertainment_and_recreation: 6, natural_features: 4 },
  wildlife_refuge: { entertainment_and_recreation: 4, natural_features: 6 }, // more conservation/observation than staged entertainment
  zoo: { entertainment_and_recreation: 7, natural_features: 3 },
  aquarium: { entertainment_and_recreation: 7, natural_features: 3 },
  water_park: { entertainment_and_recreation: 7, sports: 3 }, // genuinely physical, not passive entertainment

  // --- sports: venues that are as much spectator entertainment (or lodging/nature) as athletics ---
  stadium: { sports: 5, entertainment_and_recreation: 5 },
  arena: { sports: 5, entertainment_and_recreation: 5 },
  ski_resort: { sports: 4, natural_features: 4, lodging: 2 }, // often booked/experienced as a lodging+nature destination
  golf_course: { sports: 8, natural_features: 2 },

  // --- natural features: also the primary leisure activity, not just scenery ---
  beach: { natural_features: 6, entertainment_and_recreation: 4 }, // swimming/lounging is an activity
  scenic_spot: { natural_features: 7, entertainment_and_recreation: 3 },

  // --- health & wellness: booked as a leisure activity, not medical care ---
  spa: { health_and_wellness: 6, entertainment_and_recreation: 4 },
  massage_spa: { health_and_wellness: 6, entertainment_and_recreation: 4 },
  sauna: { health_and_wellness: 6, entertainment_and_recreation: 4 },
  yoga_studio: { health_and_wellness: 7, entertainment_and_recreation: 3 },
  wellness_center: { health_and_wellness: 6, entertainment_and_recreation: 4 },
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

  return { [category]: 10 };
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
  automotive: { googleType: 'gas_station', keyword: 'automotive services' },
  business: { googleType: 'coworking_space', keyword: 'business centers' },
  culture: { googleType: 'museum', keyword: 'cultural sites' },
  education: { googleType: 'university', keyword: 'educational institutions' },
  entertainment_and_recreation: { googleType: 'tourist_attraction', keyword: 'things to do' },
  facilities: { googleType: 'public_bath', keyword: 'public facilities' },
  finance: { googleType: 'bank', keyword: 'banks and ATMs' },
  food_and_drink: { googleType: 'restaurant', keyword: 'food' },
  geographical_areas: { googleType: 'locality', keyword: 'neighborhoods' },
  government: { googleType: 'city_hall', keyword: 'government offices' },
  health_and_wellness: { googleType: 'spa', keyword: 'wellness and spas' },
  housing: { googleType: 'apartment_building', keyword: 'housing' },
  lodging: { googleType: 'hotel', keyword: 'places to stay' },
  natural_features: { googleType: 'scenic_spot', keyword: 'nature and scenery' },
  places_of_worship: { googleType: 'church', keyword: 'places of worship' },
  services: { googleType: 'travel_agency', keyword: 'traveler services' },
  shopping: { googleType: 'shopping_mall', keyword: 'shopping' },
  sports: { googleType: 'stadium', keyword: 'sports' },
  transportation: { googleType: 'train_station', keyword: 'transportation' },
};
