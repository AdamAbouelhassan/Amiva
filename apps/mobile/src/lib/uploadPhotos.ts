import { compressAndUploadImage } from './uploadImage';

/** Resolves a mixed list of photo URIs (already-uploaded `https://…` URLs +
 * fresh local `file://`/`content://` URIs) to a list of remote URLs,
 * uploading only the local ones to `<pathPrefix>/<ts>-<i>.jpg`. Order is
 * preserved. */
export async function uploadPhotoSet(uris: string[], pathPrefix: string): Promise<string[]> {
  return Promise.all(
    uris.map((uri, index) => {
      if (/^https?:\/\//.test(uri)) return uri;
      return compressAndUploadImage(uri, `${pathPrefix}/${Date.now()}-${index}.jpg`);
    }),
  );
}
