import { env } from './env';

/** Fetch just the coordinates for a Google place id — used when "Log this"
 * is triggered on a saved place whose lat/lng weren't persisted (saves made
 * before 2026-08-31). Returns undefined on any failure; the caller falls
 * back to letting the user re-pick the location.
 *
 * Google Places API (New) — `v1/places/{id}` with a `location` field mask
 * (the legacy `maps/api/place/details` endpoint 403s now that only "Places
 * API (New)" is enabled on the project). */
export async function fetchPlaceCoords(placeId: string): Promise<{ lat: number; lng: number } | undefined> {
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.googlePlacesApiKey,
        'X-Goog-FieldMask': 'location',
      },
    });
    const json = await res.json();
    const loc = json.location;
    if (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number') {
      return { lat: loc.latitude, lng: loc.longitude };
    }
  } catch {
    /* fall through */
  }
  return undefined;
}
