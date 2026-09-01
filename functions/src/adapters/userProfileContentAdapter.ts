import { db as defaultDb } from '../adminApp';
import {
  RawProfilePlannedTrip,
  RawProfileTrip,
  UserProfileContentStore,
} from '../lib/userProfileContent';
import { PrivacySetting } from '../lib/visibility';
import { toDate } from './firestoreUtil';

const EPOCH = new Date(0);

export class FirestoreUserProfileContentStore implements UserProfileContentStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async getFriendIdsOf(userId: string): Promise<string[]> {
    const snap = await this.db.collection('friends').where('userId', '==', userId).get();
    return snap.docs.map((d) => d.data().friendId as string);
  }

  async getPrivacySetting(userId: string): Promise<PrivacySetting | undefined> {
    const snap = await this.db.collection('users').doc(userId).get();
    return snap.exists ? ((snap.data()!.privacySetting as PrivacySetting) ?? 'private') : undefined;
  }

  async listTripsByOwner(ownerId: string): Promise<RawProfileTrip[]> {
    const snap = await this.db
      .collection('trips')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        tripId: doc.id,
        name: (d.name as string) ?? 'Trip',
        location: (d.location as string) ?? '',
        coverPhotoUrl: (d.coverPhotoUrl as string) || undefined,
        startDate: toDate(d.startDate, EPOCH),
        endDate: toDate(d.endDate, EPOCH),
        visibility: (d.visibility as PrivacySetting) ?? 'private',
      };
    });
  }

  async listPlannedTripsByOwner(ownerId: string): Promise<RawProfilePlannedTrip[]> {
    const snap = await this.db
      .collection('plannedTrips')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        plannedTripId: doc.id,
        name: (d.name as string) ?? 'Trip',
        location: (d.location as string) ?? '',
        startDate: toDate(d.startDate, EPOCH),
        endDate: toDate(d.endDate, EPOCH),
        status: (d.status as string) ?? 'planning',
        visibility: (d.visibility as PrivacySetting) ?? 'private',
        collaboratorIds: (d.collaboratorIds as string[]) ?? [],
      };
    });
  }

  async listExperienceIdsByOwner(ownerId: string, limit: number): Promise<string[]> {
    const snap = await this.db
      .collection('experiences')
      .where('ownerId', '==', ownerId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.id);
  }
}
