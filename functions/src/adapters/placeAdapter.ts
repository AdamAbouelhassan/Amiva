import { db as defaultDb } from '../adminApp';
import { PlaceStore } from '../lib/ports';
import { toTimestamp } from './firestoreUtil';

export interface PlaceUpsertInput {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  /** Taxonomy migration (2026-09-02): was a single `googlePlaceType?:
   * string` (only Google's *first* returned type, discarding the rest) —
   * widened to the full array so estimateCategoryScoresFromPlace has every
   * type to blend, not just one. See PlacesAutocomplete.tsx (client) for
   * where this gets captured. */
  googlePlaceTypes: string[];
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
 *
 * Also backs PlaceStore for onExperienceCreated (taxonomy migration,
 * 2026-09-02) — reading a place's stored types is how a logged
 * experience's categoryScores gets derived server-side.
 */
export class FirestorePlaceStore implements PlaceStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('places');
  }

  async upsertPlace(place: PlaceUpsertInput, now: Date): Promise<void> {
    const ref = this.col().doc(place.placeId);
    const snap = await ref.get();
    if (snap.exists) return;
    await ref.set({ ...place, createdAt: toTimestamp(now) });
  }

  async getPlaceTypes(placeId: string): Promise<string[]> {
    const snap = await this.col().doc(placeId).get();
    if (!snap.exists) return [];
    const data = snap.data()!;
    return (data.googlePlaceTypes as string[] | undefined) ?? [];
  }
}
