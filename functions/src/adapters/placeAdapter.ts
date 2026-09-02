import { db as defaultDb } from '../adminApp';
import { PlaceRecord, PlaceStore } from '../lib/ports';
import { toTimestamp } from './firestoreUtil';

export interface PlaceUpsertInput {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  /** Google Places (New) `primaryType` (raw type id). */
  googlePlaceType?: string;
  /** The full `types` array — every type feeds `estimateCategoryScoresFromPlace`. */
  googlePlaceTypes: string[];
  /** Google Places (New) enrichment (taxonomy-reduction pass, 2026-09-02). */
  priceLevel?: string;
  rating?: number;
  userRatingCount?: number;
}

/**
 * Backs the `upsertPlace` callable — `places` is Cloud-Function-write-only
 * (firestore.rules). Idempotent: a place already on file is left untouched.
 * The approval gate (`isApprovedPlace`, packages/core) is applied in the
 * trigger *before* this is called — a rejected place never reaches here.
 *
 * Also backs `PlaceStore` for `onExperienceCreated` — reading a place's
 * stored types + priceLevel is how a logged experience's `categoryScores`
 * and `priceLevelAffinity` are derived server-side.
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
    const doc: Record<string, unknown> = {
      placeId: place.placeId,
      name: place.name,
      country: place.country,
      city: place.city,
      lat: place.lat,
      lng: place.lng,
      googlePlaceTypes: place.googlePlaceTypes,
      createdAt: toTimestamp(now),
    };
    if (place.googlePlaceType) doc.googlePlaceType = place.googlePlaceType;
    if (place.priceLevel) doc.priceLevel = place.priceLevel;
    if (typeof place.rating === 'number') doc.rating = place.rating;
    if (typeof place.userRatingCount === 'number') doc.userRatingCount = place.userRatingCount;
    await ref.set(doc);
  }

  async getPlace(placeId: string): Promise<PlaceRecord> {
    const snap = await this.col().doc(placeId).get();
    if (!snap.exists) return { types: [] };
    const data = snap.data()!;
    return {
      types: (data.googlePlaceTypes as string[] | undefined) ?? [],
      priceLevel: (data.priceLevel as string | undefined) || undefined,
    };
  }
}
