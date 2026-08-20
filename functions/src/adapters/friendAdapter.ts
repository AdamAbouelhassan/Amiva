import { db as defaultDb } from '../adminApp';
import { FriendStore } from '../lib/ports';
import { toTimestamp } from './firestoreUtil';

/** Friend edges are stored twice, doc-id keyed as `{userId}_{friendId}`
 * (technical_specification.md §3.7), so both directions are simple
 * single-doc reads/writes rather than a composite query. */
export class FirestoreFriendStore implements FriendStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('friends');
  }

  private docId(userId: string, friendId: string): string {
    return `${userId}_${friendId}`;
  }

  async createFriendEdgePair(edge: {
    userId: string;
    friendId: string;
    compatibilityScore: number;
    addedVia: 'contacts_sync' | 'qr_link';
    createdAt: Date;
  }): Promise<void> {
    const batch = this.db.batch();
    const createdAt = toTimestamp(edge.createdAt);
    batch.set(this.col().doc(this.docId(edge.userId, edge.friendId)), {
      userId: edge.userId,
      friendId: edge.friendId,
      compatibilityScore: edge.compatibilityScore,
      addedVia: edge.addedVia,
      createdAt,
    });
    batch.set(this.col().doc(this.docId(edge.friendId, edge.userId)), {
      userId: edge.friendId,
      friendId: edge.userId,
      compatibilityScore: edge.compatibilityScore,
      addedVia: edge.addedVia,
      createdAt,
    });
    await batch.commit();
  }

  async getFriendIdsOf(userId: string): Promise<string[]> {
    const snap = await this.col().where('userId', '==', userId).get();
    return snap.docs.map((doc) => doc.data().friendId as string);
  }

  async updateCompatibilityScore(userId: string, friendId: string, score: number): Promise<void> {
    await this.col().doc(this.docId(userId, friendId)).update({ compatibilityScore: score });
  }
}
