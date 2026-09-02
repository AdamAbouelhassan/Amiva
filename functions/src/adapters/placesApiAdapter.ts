import { PlaceSearchResult, PlacesSearchPort } from '../lib/placeRecommendations';

/**
 * Google Places API (New) — Text Search
 * (https://places.googleapis.com/v1/places:searchText). Migrated from the
 * legacy `maps/api/place/textsearch/json` (taxonomy-reduction pass,
 * 2026-09-02) alongside the client `PlacesAutocomplete.tsx`.
 *
 * New API requires an explicit `X-Goog-FieldMask` header — fields not
 * listed are silently omitted. We request the "Enterprise" tier fields
 * (`priceLevel`, `rating`, `userRatingCount`) because the places-of-worship
 * landmark gate already needs `userRatingCount`, so the other two ride
 * along at no extra SKU cost.
 *
 * NOT requested: the pricier "Enterprise + Atmosphere" fields
 * (`outdoorSeating`, `liveMusic`, `goodForGroups`, `servesVegetarianFood`,
 * …). They were considered for reconstructing the old
 * adventure/relaxation/nightlife nuance from amenity data but deferred —
 * they'd bill on every ingestion call and coverage is uneven. See
 * docs/claude_code_prompt_taxonomy_migration.md's follow-up.
 *
 * Same `AMIVA_GOOGLE_PLACES_API_KEY` (functions/.env). "Places API (New)"
 * must be enabled on the GCP project.
 */
const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.priceLevel',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
].join(',');
const MAX_PHOTO_REFS = 3;

interface NewPlace {
  id: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  priceLevel?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
}

interface SearchTextResponse {
  places?: NewPlace[];
}

export class GooglePlacesApi implements PlacesSearchPort {
  async textSearch(query: string, options: { type?: string } = {}): Promise<PlaceSearchResult[]> {
    const apiKey = process.env.AMIVA_GOOGLE_PLACES_API_KEY;
    if (!apiKey) throw new Error('GooglePlacesApi: AMIVA_GOOGLE_PLACES_API_KEY is not set.');

    const body: Record<string, unknown> = { textQuery: query, pageSize: 20 };
    // Text Search (New) accepts a single `includedType`, same as the legacy
    // `type` param — a multi-type list only exists on Nearby Search.
    if (options.type) body.includedType = options.type;

    const response = await fetch(SEARCH_TEXT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`GooglePlacesApi: Text Search failed (${response.status}) ${detail.slice(0, 300)}`);
    }

    const json = (await response.json()) as SearchTextResponse;
    return (json.places ?? [])
      .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
      .map((p) => ({
        placeId: p.id,
        name: p.displayName?.text ?? '',
        lat: p.location!.latitude!,
        lng: p.location!.longitude!,
        primaryType: p.primaryType,
        types: p.types ?? [],
        priceLevel: p.priceLevel,
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        photoReferences: (p.photos ?? []).map((ph) => ph.name).filter(Boolean).slice(0, MAX_PHOTO_REFS),
      }));
  }
}
