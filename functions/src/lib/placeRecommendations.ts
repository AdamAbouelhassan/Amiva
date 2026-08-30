/**
 * Backs the `getPlaceRecommendations` callable — Recommendations
 * (functional_specification.md §5.2), rebuilt (2026-08-30) to pull
 * directly from the Google Places catalog rather than existing Amiva
 * posts, filterable by country/city/category/text, each result scored
 * against the viewer's travel style via packages/core's
 * estimateCategoryScoresFromPlace (an estimate, not a measured signal —
 * see that function's header).
 *
 * This runs server-side (not a direct client-side fetch to Google, the
 * way PlacesAutocomplete.tsx does) per CLAUDE.md's repository-pattern /
 * server-is-source-of-truth principle, and because the viewer's own
 * travelStyle (needed to score results) shouldn't be read out to the
 * client just to compute a preview number.
 */
import { CATEGORY_SEARCH_HINTS, defaultMatchScorer, estimateCategoryScoresFromPlace, MatchScorer, TravelStyleCategory, TravelStyleVector } from '@amiva/core';
import { UserStore } from './ports';

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  types: string[];
  priceLevel?: number;
}

export interface PlacesSearchPort {
  textSearch(query: string, options: { type?: string }): Promise<PlaceSearchResult[]>;
}

export interface PlaceRecommendationFilter {
  country: string;
  city?: string;
  category?: TravelStyleCategory;
  text?: string;
}

export interface PlaceRecommendationResult {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  categoryScores: TravelStyleVector;
  matchScore: number;
}

/** Composes a Places Text Search query from the filter — free text and/or
 * a category's representative keyword (CATEGORY_SEARCH_HINTS), folded
 * together with the city/country, e.g. "food in Lisbon, Portugal". Text
 * Search (not Nearby Search) because it takes a free-text query rather
 * than a lat/lng + radius, so "<subject> in <city>, <country>" works
 * without a separate Geocoding call this app doesn't otherwise need. */
export function buildPlacesQuery(filter: PlaceRecommendationFilter): string {
  const subject = filter.text?.trim() || (filter.category ? CATEGORY_SEARCH_HINTS[filter.category].keyword : 'things to do');
  const location = filter.city ? `${filter.city}, ${filter.country}` : filter.country;
  return `${subject} in ${location}`;
}

export async function getPlaceRecommendations(
  stores: { placesSearch: PlacesSearchPort; userStore: UserStore },
  viewerId: string,
  filter: PlaceRecommendationFilter,
  limit = 20,
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<PlaceRecommendationResult[]> {
  const [{ travelStyle: viewerVector }, results] = await Promise.all([
    stores.userStore.getUserStyle(viewerId),
    stores.placesSearch.textSearch(buildPlacesQuery(filter), {
      type: filter.category ? CATEGORY_SEARCH_HINTS[filter.category].googleType : undefined,
    }),
  ]);

  return results
    .map((place) => {
      const categoryScores = estimateCategoryScoresFromPlace(place.types, place.priceLevel);
      return {
        placeId: place.placeId,
        name: place.name,
        // Text Search only returns a formatted_address string, not
        // structured components — rather than an extra per-result Place
        // Details call (or fragile string parsing) to recover city/
        // country, results inherit the filter's own location, which is
        // correct in the common case (the filter is exactly what was
        // searched for).
        country: filter.country,
        city: filter.city ?? filter.country,
        lat: place.lat,
        lng: place.lng,
        categoryScores,
        matchScore: matchScorer.score(viewerVector, categoryScores),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
