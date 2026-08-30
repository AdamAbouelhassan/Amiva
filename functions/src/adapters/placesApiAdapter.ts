import { PlaceSearchResult, PlacesSearchPort } from '../lib/placeRecommendations';

interface TextSearchResponseResult {
  place_id: string;
  name: string;
  geometry?: { location?: { lat: number; lng: number } };
  types?: string[];
  price_level?: number;
}

interface TextSearchResponse {
  results?: TextSearchResponseResult[];
  status: string;
}

/**
 * Google Places (legacy) Text Search — the same API family
 * PlacesAutocomplete.tsx already uses client-side (autocomplete + place
 * details), so this needs no new API enablement or key, just the same
 * AMIVA_GOOGLE_PLACES_API_KEY read server-side instead (functions/.env,
 * gitignored — see functions/.env.example).
 */
export class GooglePlacesApi implements PlacesSearchPort {
  async textSearch(query: string, options: { type?: string } = {}): Promise<PlaceSearchResult[]> {
    const apiKey = process.env.AMIVA_GOOGLE_PLACES_API_KEY;
    if (!apiKey) throw new Error('GooglePlacesApi: AMIVA_GOOGLE_PLACES_API_KEY is not set.');

    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    if (options.type) url.searchParams.set('type', options.type);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    const json = (await response.json()) as TextSearchResponse;
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      throw new Error(`GooglePlacesApi: Text Search failed (${json.status})`);
    }

    return (json.results ?? [])
      .filter((result) => !!result.geometry?.location)
      .map((result) => ({
        placeId: result.place_id,
        name: result.name,
        lat: result.geometry!.location!.lat,
        lng: result.geometry!.location!.lng,
        types: result.types ?? [],
        priceLevel: result.price_level,
      }));
  }
}
