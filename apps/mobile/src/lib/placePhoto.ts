import { env } from './env';

/**
 * Builds a Google Places (New) photo URL from a photo **resource name**
 * (`places/PLACE_ID/photos/PHOTO_ID`) returned on a `photos[].name` field.
 * Migrated from the legacy `photo_reference` scheme (taxonomy-reduction
 * pass, 2026-09-02).
 *
 * The `/media` endpoint is appended to the raw resource name — its `/`
 * separators must NOT be percent-encoded, so this is plain string
 * concatenation, not a URL param.
 */
export function placePhotoUrl(photoName: string, maxWidth = 800): string | undefined {
  if (!photoName || !env.googlePlacesApiKey) return undefined;
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${env.googlePlacesApiKey}`;
}
