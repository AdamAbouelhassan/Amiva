import { db as defaultDb } from '../adminApp';
import { TripRecord, TripStore } from '../lib/ports';

export class FirestoreTripStore implements TripStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('trips');
  }

  async getTrip(tripId: string): Promise<TripRecord | undefined> {
    const snap = await this.col().doc(tripId).get();
    if (!snap.exists) return undefined;
    const data = snap.data()!;
    return { tripId, coverPhotoUrl: data.coverPhotoUrl };
  }

  async setCoverPhotoIfUnset(tripId: string, photoUrl: string): Promise<void> {
    await this.col().doc(tripId).update({ coverPhotoUrl: photoUrl });
  }
}
