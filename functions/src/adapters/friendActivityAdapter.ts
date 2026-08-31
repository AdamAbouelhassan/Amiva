import { admin, db as defaultDb } from '../adminApp';
import {
  FriendActivityStore,
  RawCompletedPlannedTrip,
  RawExperience,
  RawFriendEdge,
  RawSave,
  RawTrip,
} from '../lib/friendsActivity';
import { PrivacySetting } from '../lib/visibility';
import { chunk, FIRESTORE_IN_LIMIT, toDate } from './firestoreUtil';

const EPOCH = new Date(0);

/** Single Firestore-backed port for the Friends activity feed — reads
 * across `experiences`, `trips`, `saves`, `plannedTrips`, `friends` and
 * `users`, each restricted to a set of owner ids and batched over
 * Firestore's 30-value `in` cap. */
export class FirestoreFriendActivityStore implements FriendActivityStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  async getFriendIdsOf(userId: string): Promise<string[]> {
    const snap = await this.db.collection('friends').where('userId', '==', userId).get();
    return snap.docs.map((d) => d.data().friendId as string);
  }

  private async byOwners<T>(
    collection: string,
    field: string,
    ownerIds: string[],
    orderField: string,
    limit: number,
    map: (doc: FirebaseFirestore.QueryDocumentSnapshot) => T,
  ): Promise<T[]> {
    if (ownerIds.length === 0) return [];
    const batches = await Promise.all(
      chunk(ownerIds, FIRESTORE_IN_LIMIT).map((batch) =>
        this.db
          .collection(collection)
          .where(field, 'in', batch)
          .orderBy(orderField, 'desc')
          .limit(limit)
          .get(),
      ),
    );
    return batches.flatMap((snap) => snap.docs.map(map));
  }

  listExperiencesByOwners(ownerIds: string[], limit: number): Promise<RawExperience[]> {
    return this.byOwners('experiences', 'ownerId', ownerIds, 'createdAt', limit, (doc) => ({
      experienceId: doc.id,
      ownerId: doc.data().ownerId as string,
      createdAt: toDate(doc.data().createdAt, EPOCH),
    }));
  }

  listTripsByOwners(ownerIds: string[], limit: number): Promise<RawTrip[]> {
    return this.byOwners('trips', 'ownerId', ownerIds, 'createdAt', limit, (doc) => {
      const d = doc.data();
      return {
        tripId: doc.id,
        ownerId: d.ownerId as string,
        name: (d.name as string) ?? 'Trip',
        location: (d.location as string) ?? '',
        coverPhotoUrl: (d.coverPhotoUrl as string) || undefined,
        startDate: toDate(d.startDate, EPOCH),
        endDate: toDate(d.endDate, EPOCH),
        visibility: (d.visibility as PrivacySetting) ?? 'private',
        createdAt: toDate(d.createdAt, EPOCH),
      };
    });
  }

  async listSavesByOwners(ownerIds: string[], limit: number): Promise<RawSave[]> {
    const rawSaves = await this.byOwners('saves', 'userId', ownerIds, 'savedAt', limit, (doc) => ({
      actorId: doc.data().userId as string,
      experienceId: doc.data().experienceId as string,
      savedAt: toDate(doc.data().savedAt, EPOCH),
    }));
    if (rawSaves.length === 0) return [];

    // Join each save to its experience's owner (needed for the visibility
    // check — a friend may have saved a stranger's experience).
    const expIds = [...new Set(rawSaves.map((s) => s.experienceId))];
    const ownerByExp: Record<string, string> = {};
    await Promise.all(
      chunk(expIds, FIRESTORE_IN_LIMIT).map(async (batch) => {
        const snap = await this.db
          .collection('experiences')
          .where(admin.firestore.FieldPath.documentId(), 'in', batch)
          .get();
        snap.docs.forEach((d) => (ownerByExp[d.id] = d.data().ownerId as string));
      }),
    );

    return rawSaves
      .filter((s) => ownerByExp[s.experienceId])
      .map((s) => ({ ...s, experienceOwnerId: ownerByExp[s.experienceId]! }));
  }

  listCompletedPlannedTripsByOwners(ownerIds: string[], limit: number): Promise<RawCompletedPlannedTrip[]> {
    if (ownerIds.length === 0) return Promise.resolve([]);
    return Promise.all(
      chunk(ownerIds, FIRESTORE_IN_LIMIT).map((batch) =>
        this.db
          .collection('plannedTrips')
          .where('ownerId', 'in', batch)
          .where('status', '==', 'completed')
          .orderBy('completedAt', 'desc')
          .limit(limit)
          .get(),
      ),
    ).then((batches) =>
      batches.flatMap((snap) =>
        snap.docs
          .filter((doc) => doc.data().completedAt)
          .map((doc) => {
            const d = doc.data();
            return {
              plannedTripId: doc.id,
              ownerId: d.ownerId as string,
              location: (d.location as string) ?? '',
              visibility: (d.visibility as PrivacySetting) ?? 'private',
              completedAt: toDate(d.completedAt, EPOCH),
            };
          }),
      ),
    );
  }

  listFriendEdgesByOwners(ownerIds: string[], limit: number): Promise<RawFriendEdge[]> {
    return this.byOwners('friends', 'userId', ownerIds, 'createdAt', limit, (doc) => ({
      userId: doc.data().userId as string,
      friendId: doc.data().friendId as string,
      createdAt: toDate(doc.data().createdAt, EPOCH),
    }));
  }

  async getPrivacySettings(userIds: string[]): Promise<Record<string, PrivacySetting>> {
    if (userIds.length === 0) return {};
    const result: Record<string, PrivacySetting> = {};
    await Promise.all(
      chunk([...new Set(userIds)], FIRESTORE_IN_LIMIT).map(async (batch) => {
        const snap = await this.db
          .collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', batch)
          .get();
        snap.docs.forEach((d) => (result[d.id] = (d.data().privacySetting as PrivacySetting) ?? 'private'));
      }),
    );
    return result;
  }
}
