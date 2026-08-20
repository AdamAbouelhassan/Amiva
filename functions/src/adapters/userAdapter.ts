import { TravelStyleVector } from '@amiva/core';
import { db as defaultDb } from '../adminApp';
import { UserStore, UserStyleRecord } from '../lib/ports';
import { toDate, toTimestamp } from './firestoreUtil';

export class FirestoreUserStore implements UserStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('users');
  }

  async getUserStyle(userId: string): Promise<UserStyleRecord> {
    const snap = await this.col().doc(userId).get();
    if (!snap.exists) throw new Error(`FirestoreUserStore: user ${userId} not found`);
    const data = snap.data()!;
    return {
      travelStyle: data.travelStyle as TravelStyleVector,
      travelStyleBaseline: data.travelStyleBaseline as TravelStyleVector,
      travelStyleLastUpdated: toDate(data.travelStyleLastUpdated, new Date(0)),
    };
  }

  async saveAutomaticStyleUpdate(userId: string, travelStyle: TravelStyleVector): Promise<void> {
    await this.col().doc(userId).update({ travelStyle });
  }

  async saveManualStyleEdit(userId: string, record: UserStyleRecord): Promise<void> {
    await this.col().doc(userId).update({
      travelStyle: record.travelStyle,
      travelStyleBaseline: record.travelStyleBaseline,
      travelStyleLastUpdated: toTimestamp(record.travelStyleLastUpdated),
    });
  }
}
