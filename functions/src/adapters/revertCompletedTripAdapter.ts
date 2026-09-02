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
      status: data.status,
      loggedTripIds: (data.loggedTripIds as Record<string, string>) ?? {},
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

  async removeLoggedTrip(
    plannedTripId: string,
    userId: string,
    restoreToPlanning: boolean,
  ): Promise<void> {
    const patch: Record<string, unknown> = {
      [`loggedTripIds.${userId}`]: admin.firestore.FieldValue.delete(),
    };
    if (restoreToPlanning) {
      patch.status = 'planning';
      patch.completedAt = admin.firestore.FieldValue.delete();
    }
    await this.db.collection('plannedTrips').doc(plannedTripId).update(patch);
  }
}
