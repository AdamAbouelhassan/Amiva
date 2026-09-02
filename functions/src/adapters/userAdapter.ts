import { coerceTravelStyleVector, TravelStyleVector } from '@amiva/core';
import { db as defaultDb } from '../adminApp';
import { UserStore, UserStyleRecord, VisibilityStore } from '../lib/ports';
import { toDate, toTimestamp } from './firestoreUtil';

export class FirestoreUserStore implements UserStore, VisibilityStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('users');
  }

  async getUserStyle(userId: string): Promise<UserStyleRecord> {
    const snap = await this.col().doc(userId).get();
    if (!snap.exists) throw new Error(`FirestoreUserStore: user ${userId} not found`);
    const data = snap.data()!;
    return {
      // coerceTravelStyleVector: a pre-taxonomy-migration (2026-09-02)
      // document still has the old 8-category shape on disk — reads as
      // (mostly) zero server-side too, rather than propagating NaN
      // through the decay/cosine-similarity math. See types.ts.
      travelStyle: coerceTravelStyleVector(data.travelStyle),
      travelStyleBaseline: coerceTravelStyleVector(data.travelStyleBaseline),
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

  /** Batched via getAll rather than N individual .get() calls — the
   * Admin SDK's getAll accepts up to 500 refs in one round trip, well
   * above anything Feed/Trending's candidate pools need. */
  async getPrivacySettings(userIds: string[]): Promise<Record<string, 'public' | 'private' | 'friends'>> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return {};

    const refs = uniqueIds.map((id) => this.col().doc(id));
    const snaps = await this.db.getAll(...refs);

    const result: Record<string, 'public' | 'private' | 'friends'> = {};
    snaps.forEach((snap, i) => {
      if (snap.exists) result[uniqueIds[i]!] = snap.data()!.privacySetting;
    });
    return result;
  }
}
