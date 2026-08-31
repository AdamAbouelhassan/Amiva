import { env } from './env';

/**
 * Builds a Google Places Photo URL from a `photo_reference` returned by a
 * Places search. The API key is the same one already used client-side for
 * autocomplete (see PlacesAutocomplete.tsx) — Places restricts photo URLs
 * to the referrer/bundle anyway, so no new exposure.
 */
export function placePhotoUrl(photoReference: string, maxWidth = 800): string | undefined {
  if (!photoReference || !env.googlePlacesApiKey) return undefined;
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', String(maxWidth));
  url.searchParams.set('photo_reference', photoReference);
  url.searchParams.set('key', env.googlePlacesApiKey);
  return url.toString();
}
