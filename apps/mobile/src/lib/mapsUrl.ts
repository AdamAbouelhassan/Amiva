import { Linking } from 'react-native';

/**
 * A universal Google Maps URL — opens the Google Maps app when installed,
 * the browser otherwise, on both platforms. `query_place_id` pins the
 * exact place; `query` is the required human-readable fallback.
 * https://developers.google.com/maps/documentation/urls/get-started
 */
export function googleMapsUrl(place: {
  name: string;
  city?: string;
  country?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}): string {
  const params = new URLSearchParams({ api: '1' });
  const query = [place.name, place.city, place.country].filter(Boolean).join(', ');
  params.set('query', query || `${place.lat},${place.lng}`);
  if (place.placeId) params.set('query_place_id', place.placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function openInGoogleMaps(place: Parameters<typeof googleMapsUrl>[0]): void {
  Linking.openURL(googleMapsUrl(place)).catch(() => {
    /* no browser / maps app, or the user cancelled — nothing to do */
  });
}
