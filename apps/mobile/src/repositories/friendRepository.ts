/**
 * Repository for `friends`. Edges are never written directly by the
 * client (compatibilityScore is server-computed, firestore.rules denies
 * client writes) — `add` calls the `onFriendAdded` callable instead.
 */
import { DocumentData, collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/client';
import { toDate } from '../firebase/timestamps';
import { FriendEdgeDoc } from './types';

const COLLECTION = 'friends';

function docId(userId: string, friendId: string): string {
  return `${userId}_${friendId}`;
}

function fromFirestore(data: DocumentData): FriendEdgeDoc {
  return {
    userId: data.userId,
    friendId: data.friendId,
    compatibilityScore: data.compatibilityScore,
    addedVia: data.addedVia,
    createdAt: toDate(data.createdAt),
  };
}

const addFriendCallable = httpsCallable<
  { friendId: string; addedVia: 'contacts_sync' | 'qr_link' },
  { compatibilityScore: number }
>(functions, 'onFriendAdded');

export const FriendRepository = {
  /** Direct add, no invite/accept step (functional_specification.md §6.3):
   * scanning a QR/link, or picking a contacts-sync suggestion. */
  async add(friendId: string, addedVia: 'contacts_sync' | 'qr_link'): Promise<{ compatibilityScore: number }> {
    const result = await addFriendCallable({ friendId, addedVia });
    return result.data;
  },

  async getEdge(userId: string, friendId: string): Promise<FriendEdgeDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, docId(userId, friendId)));
    return snap.exists() ? fromFirestore(snap.data()) : undefined;
  },

  /** Sorted by compatibility, highest first — useful for a "most
   * compatible friends" surface as well as a plain friends list. */
  async listByUser(userId: string): Promise<FriendEdgeDoc[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('compatibilityScore', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.data()));
  },
};
