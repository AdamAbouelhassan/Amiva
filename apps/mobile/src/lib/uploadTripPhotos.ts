import { uploadPhotoSet } from './uploadPhotos';

export function uploadTripPhotos(uris: string[], ownerId: string): Promise<string[]> {
  return uploadPhotoSet(uris, `tripPhotos/${ownerId}`);
}
