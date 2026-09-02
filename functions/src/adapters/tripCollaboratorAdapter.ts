import * as admin from 'firebase-admin';
import { db as defaultDb } from '../adminApp';
import { NotificationRecord } from '../lib/ports';
import { CollaboratorPlannedTrip, TripCollaboratorStore } from '../lib/tripCollaborators';
import { FirestoreNotificationStore } from './notificationAdapter';

export class FirestoreTripCollaboratorStore implements TripCollaboratorStore {
  private readonly notifications: FirestoreNotificationStore;

  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {
    this.notifications = new FirestoreNotificationStore(db);
  }

  async getPlannedTrip(plannedTripId: string): Promise<CollaboratorPlannedTrip | undefined> {
    const snap = await this.db.collection('plannedTrips').doc(plannedTripId).get();
    if (!snap.exists) return undefined;
    const d = snap.data()!;
    return {
      ownerId: d.ownerId as string,
      collaboratorIds: (d.collaboratorIds as string[]) ?? [],
    };
  }

  async userExists(userId: string): Promise<boolean> {
    return (await this.db.collection('users').doc(userId).get()).exists;
  }

  async addCollaborator(plannedTripId: string, collaboratorId: string): Promise<void> {
    await this.db
      .collection('plannedTrips')
      .doc(plannedTripId)
      .update({ collaboratorIds: admin.firestore.FieldValue.arrayUnion(collaboratorId) });
  }

  createNotification(input: Omit<NotificationRecord, 'notificationId' | 'read'>): Promise<string> {
    return this.notifications.createNotification(input);
  }
}
