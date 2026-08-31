import { admin, db as defaultDb } from '../adminApp';
import { RevertCompletedTripStore, RevertPlannedTripRecord } from '../lib/revertCompletedTrip';

export class FirestoreRevertCompletedTripStore implements RevertCompletedTripStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async getPlannedTrip(plannedTripId: string): Promise<RevertPlannedTripRecord> {
    const snap = await this.db.collection('plannedTrips').doc(plannedTripId).get();
    if (!snap.exists) throw new Error(`PlannedTrip ${plannedTripId} not found`);
    const data = snap.data()!;
    return {
      plannedTripId,
      ownerId: data.ownerId,
      status: data.status,
      convertedToTripId: data.convertedToTripId ?? undefined,
    };
  }

  async detachExperiences(tripId: string): Promise<number> {
    const snap = await this.db.collection('experiences').where('tripId', '==', tripId).get();
    if (snap.empty) return 0;
    const batch = this.db.batch();
    snap.docs.forEach((doc) => batch.update(doc.ref, { tripId: null }));
    await batch.commit();
    return snap.size;
  }

  async deleteTrip(tripId: string): Promise<void> {
    await this.db.collection('trips').doc(tripId).delete();
  }

  async restorePlannedTrip(plannedTripId: string): Promise<void> {
    await this.db
      .collection('plannedTrips')
      .doc(plannedTripId)
      .update({
        status: 'planning',
        completedAt: admin.firestore.FieldValue.delete(),
        convertedToTripId: admin.firestore.FieldValue.delete(),
      });
  }
}
