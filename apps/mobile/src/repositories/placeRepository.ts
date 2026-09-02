/**
 * `places` is Cloud-Function-write-only (firestore.rules) — the client
 * can read it directly but must upsert new places through the
 * `upsertPlace` callable (see functions/src/adapters/placeAdapter.ts for
 * why this callable exists).
 */
import { httpsCallable } from 'firebase/functions';
import { DocumentData, doc, getDoc } from 'firebase/firestore';
import { db, functions } from '../firebase/client';
import { toDate } from '../firebase/timestamps';
import { PlaceDoc } from './types';

const COLLECTION = 'places';

function fromFirestore(id: string, data: DocumentData): PlaceDoc {
  return {
    placeId: id,
    name: data.name,
    country: data.country,
    city: data.city,
    lat: data.lat,
    lng: data.lng,
    googlePlaceTypes: data.googlePlaceTypes ?? [],
    createdAt: toDate(data.createdAt),
  };
}

const upsertPlaceCallable = httpsCallable<Omit<PlaceDoc, 'createdAt'>, { success: true }>(
  functions,
  'upsertPlace',
);

export const PlaceRepository = {
  async getById(placeId: string): Promise<PlaceDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, placeId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  /** Called after the user picks a result from Google Places autocomplete
   * — registers/normalizes the place in Amiva if it's the first time it's
   * been referenced. Idempotent. */
  async upsertFromGooglePlace(place: Omit<PlaceDoc, 'createdAt'>): Promise<void> {
    await upsertPlaceCallable(place);
  },
};
