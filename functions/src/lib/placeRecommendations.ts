/**
 * Backs the `getPlaceRecommendations` callable — the Discovery "Local" tab
 * (functional_specification.md §5.2). Pulls from the Google Places catalog
 * (not Amiva posts) near a location the user picked, and shapes the result
 * into **category rows ordered by the viewer's travel style**: one
 * horizontal-scroll row per top category, strongest interest first, each
 * row's places ranked by how well they match the viewer.
 *
 * A free-text keyword collapses everything into a single "search results"
 * row (optionally narrowed by the selected category); an explicit category
 * filter shows just that one row.
 *
 * Runs server-side (not a client fetch to Google) per CLAUDE.md's
 * repository-pattern / server-is-source-of-truth principle, and because
 * the viewer's own travelStyle (needed to rank) shouldn't be shipped to
 * the client just for a preview number.
 *
 * Cost note: the default view fires one Text Search per top category
 * (`DEFAULT_ROWS`). Fine at MVP volumes given the client caches results
 * per location for ~10 min; revisit (Nearby Search, a cache collection) if
 * Places billing becomes a concern.
 */
import {
  CATEGORY_SEARCH_HINTS,
  defaultMatchScorer,
  estimateCategoryScoresFromPlace,
  MatchScorer,
  topCategories,
  TRAVEL_STYLE_CATEGORIES,
  TravelStyleCategory,
  TravelStyleVector,
} from '@amiva/core';
import { UserStore } from './ports';

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  types: string[];
  priceLevel?: number;
  /** Google rating, 1.0–5.0 (absent for unrated places). */
  rating?: number;
  /** How many Google reviews the rating is based on. */
  userRatingsTotal?: number;
  /** Google Places photo references — the client turns these into image
   * URLs via the Places Photo endpoint (see apps/mobile/src/lib/placePhoto.ts). */
  photoReferences?: string[];
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
  photoReferences: string[];
  /** Short human category ("Restaurant", "Night club", …), from the
   * place's Google types — the Google-Maps-style subtitle. */
  primaryType?: string;
  /** Google rating, 1.0–5.0 (absent for unrated places). */
  rating?: number;
  /** Number of Google reviews behind the rating. */
  userRatingsTotal?: number;
}

export interface LocalSection {
  /** `'search'` for a keyword result set, otherwise the category id. */
  key: string;
  /** The category this row represents, or `null` for keyword search. */
  category: TravelStyleCategory | null;
  items: PlaceRecommendationResult[];
}

const DEFAULT_ROWS = 5;
const DEFAULT_PER_ROW = 12;

const GENERIC_TYPES = new Set([
  'point_of_interest',
  'establishment',
  'premise',
  'geocode',
  'political',
  'food',
  'store',
]);

/** Turns a Google Places `types` array into a short display label, e.g.
 * `['night_club','bar',...]` → "Night club". Undefined when nothing
 * meaningful is left. */
export function prettyPlaceType(types: string[] = []): string | undefined {
  const type = types.find((x) => !GENERIC_TYPES.has(x));
  if (!type) return undefined;
  const words = type.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Single-subject Places Text Search query — free text OR a category
 * keyword, folded with the location. */
export function buildPlacesQuery(filter: PlaceRecommendationFilter): string {
  const subject =
    filter.text?.trim() || (filter.category ? CATEGORY_SEARCH_HINTS[filter.category].keyword : 'things to do');
  const location = filter.city ? `${filter.city}, ${filter.country}` : filter.country;
  return `${subject} in ${location}`;
}

export async function getPlaceRecommendations(
  stores: { placesSearch: PlacesSearchPort; userStore: UserStore },
  viewerId: string,
  filter: PlaceRecommendationFilter,
  opts: { rows?: number; perRow?: number } = {},
  matchScorer: MatchScorer = defaultMatchScorer,
): Promise<LocalSection[]> {
  const rowCount = Math.min(opts.rows ?? DEFAULT_ROWS, TRAVEL_STYLE_CATEGORIES.length);
  const perRow = opts.perRow ?? DEFAULT_PER_ROW;
  const { travelStyle: viewerVector } = await stores.userStore.getUserStyle(viewerId);
  const location = filter.city ? `${filter.city}, ${filter.country}` : filter.country;

  const toResult = (place: PlaceSearchResult): PlaceRecommendationResult => {
    const categoryScores = estimateCategoryScoresFromPlace(place.types, place.priceLevel);
    return {
      placeId: place.placeId,
      name: place.name,
      // Text Search returns only a formatted_address string; results
      // inherit the filter's location, correct in the common case.
      country: filter.country,
      city: filter.city ?? filter.country,
      lat: place.lat,
      lng: place.lng,
      categoryScores,
      matchScore: matchScorer.score(viewerVector, categoryScores),
      photoReferences: place.photoReferences ?? [],
      primaryType: prettyPlaceType(place.types),
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
    };
  };

  const rank = (raw: PlaceSearchResult[], take: number): PlaceRecommendationResult[] =>
    raw
      .map(toResult)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, take);

  const rowForCategory = async (category: TravelStyleCategory, take: number): Promise<LocalSection> => {
    const raw = await stores.placesSearch.textSearch(`${CATEGORY_SEARCH_HINTS[category].keyword} in ${location}`, {
      type: CATEGORY_SEARCH_HINTS[category].googleType,
    });
    return { key: category, category, items: rank(raw, take) };
  };

  // A) keyword search — one flat row, optionally narrowed by the category
  const text = filter.text?.trim();
  if (text) {
    const subject = [text, filter.category ? CATEGORY_SEARCH_HINTS[filter.category].keyword : '']
      .filter(Boolean)
      .join(' ');
    const raw = await stores.placesSearch.textSearch(`${subject} in ${location}`, {
      type: filter.category ? CATEGORY_SEARCH_HINTS[filter.category].googleType : undefined,
    });
    const items = rank(raw, perRow * 2);
    return items.length ? [{ key: 'search', category: filter.category ?? null, items }] : [];
  }

  // B) one selected category — just that row
  if (filter.category) {
    const section = await rowForCategory(filter.category, perRow * 2);
    return section.items.length ? [section] : [];
  }

  // C) default — a row per top style category, strongest interest first,
  //    a place shown in at most one row.
  const categories = topCategories(viewerVector, rowCount);
  const rows = await Promise.all(categories.map((c) => rowForCategory(c, perRow)));
  const seen = new Set<string>();
  return rows
    .map((row) => ({
      ...row,
      items: row.items.filter((i) => !seen.has(i.placeId) && seen.add(i.placeId)),
    }))
    .filter((row) => row.items.length > 0);
}
