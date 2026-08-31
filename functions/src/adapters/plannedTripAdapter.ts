import { db as defaultDb } from '../adminApp';
import {
  CreateLogbookTripInput,
  PlannedTripConversionStore,
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
      name: data.name ?? '',
      location: data.location ?? '',
      country: data.country ?? '',
      city: data.city ?? undefined,
      notes: data.notes ?? undefined,
      accommodation: data.accommodation ?? undefined,
      startDate: toDate(data.startDate, new Date(0)),
      endDate: toDate(data.endDate, new Date(0)),
      visibility: data.visibility ?? 'private',
    };
  }

  async createTripForPlannedTrip(ownerId: string, input: CreateLogbookTripInput): Promise<string> {
    const ref = this.db.collection('trips').doc();
    await ref.set({
      ownerId,
      location: input.location,
      country: input.country,
      city: input.city ?? null,
      name: input.name,
      startDate: toTimestamp(input.startDate),
      endDate: toTimestamp(input.endDate),
      notes: input.notes ?? null,
      accommodation: input.accommodation ?? null,
      photoUrls: input.photoUrls,
      coverPhotoUrl: input.photoUrls[0] ?? '',
      visibility: input.visibility,
      createdAt: toTimestamp(new Date()),
    });
    return ref.id;
  }

  async markPlannedTripCompleted(plannedTripId: string, tripId: string): Promise<void> {
    await this.db.collection('plannedTrips').doc(plannedTripId).update({
      status: 'completed',
      completedAt: toTimestamp(new Date()),
      convertedToTripId: tripId,
    });
  }
}
