import { findOwningTrip, generateTripName, TripForCategorization } from '@amiva/core';
import { db as defaultDb } from '../adminApp';
import {
  ExperienceDraftInput,
  PlannedTripConversionStore,
  PlannedTripItemRecord,
  PlannedTripRecord,
} from '../lib/plannedTripConversion';
import { toDate, toTimestamp } from './firestoreUtil';

export class FirestorePlannedTripConversionStore implements PlannedTripConversionStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async getPlannedTrip(plannedTripId: string): Promise<PlannedTripRecord> {
    const snap = await this.db.collection('plannedTrips').doc(plannedTripId).get();
    if (!snap.exists) throw new Error(`PlannedTrip ${plannedTripId} not found`);
    const data = snap.data()!;
    return {
      plannedTripId,
      ownerId: data.ownerId,
      locations: data.locations ?? [],
      startDate: toDate(data.startDate, new Date(0)),
      endDate: toDate(data.endDate, new Date(0)),
    };
  }

  async getPlannedTripItem(itemId: string): Promise<PlannedTripItemRecord> {
    const snap = await this.db.collection('plannedTripItems').doc(itemId).get();
    if (!snap.exists) throw new Error(`PlannedTripItem ${itemId} not found`);
    const data = snap.data()!;
    return {
      itemId,
      plannedTripId: data.plannedTripId,
      placeId: data.placeId,
      title: data.title,
    };
  }

  async findOrCreateTripForCountry(
    ownerId: string,
    country: string,
    range: { startDate: Date; endDate: Date },
  ): Promise<string> {
    const existingSnap = await this.db
      .collection('trips')
      .where('ownerId', '==', ownerId)
      .where('countries', 'array-contains', country)
      .get();

    const candidates: TripForCategorization[] = existingSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        tripId: doc.id,
        countries: data.countries,
        startDate: toDate(data.startDate, new Date(0)),
        endDate: toDate(data.endDate, new Date(0)),
      };
    });

    const owning = findOwningTrip(country, range.startDate, candidates) ?? findOwningTrip(country, range.endDate, candidates);
    if (owning) return owning.tripId;

    const ownerSnap = await this.db.collection('users').doc(ownerId).get();
    const visibility = ownerSnap.exists ? ownerSnap.data()!.privacySetting ?? 'private' : 'private';

    const ref = this.db.collection('trips').doc();
    await ref.set({
      tripId: ref.id,
      ownerId,
      countries: [country],
      startDate: toTimestamp(range.startDate),
      endDate: toTimestamp(range.endDate),
      name: generateTripName([country], range),
      coverPhotoUrl: '',
      visibility,
      createdAt: toTimestamp(new Date()),
    });
    return ref.id;
  }

  async createExperience(
    ownerId: string,
    tripId: string | undefined,
    item: PlannedTripItemRecord,
    details: ExperienceDraftInput,
  ): Promise<string> {
    const placeSnap = await this.db.collection('places').doc(item.placeId).get();
    const place = placeSnap.data();

    const ref = this.db.collection('experiences').doc();
    const now = toTimestamp(new Date());
    await ref.set({
      experienceId: ref.id,
      ownerId,
      tripId: tripId ?? null,
      placeId: item.placeId,
      city: place?.city ?? '',
      country: place?.country ?? '',
      title: item.title,
      notes: details.notes,
      rating: details.rating,
      photoUrls: details.photoUrls,
      categoryScores: details.categoryScores,
      date: toTimestamp(details.date),
      dateSource: details.dateSource,
      postType: 'experience',
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }

  async markItemConverted(itemId: string, experienceId: string): Promise<void> {
    await this.db
      .collection('plannedTripItems')
      .doc(itemId)
      .update({ completed: true, convertedToExperienceId: experienceId });
  }
}
