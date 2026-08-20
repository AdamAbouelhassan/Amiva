import { db as defaultDb } from '../adminApp';
import { toTimestamp } from './firestoreUtil';

export interface PlaceUpsertInput {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  googlePlaceType?: string;
}

/**
 * Backs an `upsertPlace` callable — required because firestore.rules makes
 * `places` Cloud-Function-write-only (technical_specification.md §6:
 * "writable only by Cloud Functions, to prevent client-side pollution of
 * the normalized place list"), but nothing in the §5 API table creates a
 * Place doc when a user first references a Google Place. This is the
 * minimal missing piece — same category of addition as
 * `updateTravelStyleManual`. Idempotent: a place already on file is left
 * untouched rather than overwritten by a possibly-stale client payload.
 */
export class FirestorePlaceStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async upsertPlace(place: PlaceUpsertInput, now: Date): Promise<void> {
    const ref = this.db.collection('places').doc(place.placeId);
    const snap = await ref.get();
    if (snap.exists) return;
    await ref.set({ ...place, createdAt: toTimestamp(now) });
  }
}
