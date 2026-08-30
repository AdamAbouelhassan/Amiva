/**
 * Shared image pipeline — technical_specification.md §1: "expo-image-
 * picker + client-side compression before upload to Firebase Storage."
 * Used for both profile photos and experience photos.
 */
import * as ImageManipulator from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/client';

const MAX_DIMENSION = 1600;
const COMPRESSION_QUALITY = 0.75;

export async function compressAndUploadImage(localUri: string, storagePath: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const response = await fetch(manipulated.uri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
