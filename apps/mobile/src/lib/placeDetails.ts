import { env } from './env';

/** Fetch just the coordinates for a Google place id — used when "Log this"
 * is triggered on a saved place whose lat/lng weren't persisted (saves made
 * before 2026-08-31). Returns undefined on any failure; the caller falls
 * back to letting the user re-pick the location. */
export async function fetchPlaceCoords(placeId: string): Promise<{ lat: number; lng: number } | undefined> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${env.googlePlacesApiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    const loc = json.result?.geometry?.location;
    if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') return { lat: loc.lat, lng: loc.lng };
  } catch {
    /* fall through */
  }
  return undefined;
}
