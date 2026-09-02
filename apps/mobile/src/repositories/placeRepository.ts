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
    googlePlaceType: data.googlePlaceType ?? undefined,
    googlePlaceTypes: data.googlePlaceTypes ?? [],
    priceLevel: data.priceLevel ?? undefined,
    rating: typeof data.rating === 'number' ? data.rating : undefined,
    userRatingCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : undefined,
    createdAt: toDate(data.createdAt),
  };
}

const upsertPlaceCallable = httpsCallable<
  Omit<PlaceDoc, 'createdAt'>,
  { success: true } | { rejected: true; reason?: string }
>(functions, 'upsertPlace');

export const PlaceRepository = {
  async getById(placeId: string): Promise<PlaceDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, placeId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  /** Called after the user picks a result from Google Places autocomplete —
   * registers/normalizes the place in Amiva if it's the first time it's
   * been referenced. Idempotent. Returns `{ rejected: true }` when the
   * place fails the ingestion gate (non-experience type, or a non-landmark
   * place of worship — taxonomy-reduction pass, 2026-09-02); the caller
   * blocks the log. */
  async upsertFromGooglePlace(
    place: Omit<PlaceDoc, 'createdAt'>,
  ): Promise<{ rejected: boolean; reason?: string }> {
    const res = await upsertPlaceCallable(place);
    const data = res.data as { rejected?: true; reason?: string };
    return { rejected: !!data.rejected, reason: data.reason };
  },
};
