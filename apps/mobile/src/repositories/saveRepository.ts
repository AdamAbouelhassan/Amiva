/**
 * Repository for `saves` — the only engagement action on a post
 * (functional_specification.md §5.1: "no like or comment functionality").
 * Doc id is `{userId}_{experienceId}` (technical_specification.md §3.5).
 */
import { DocumentData, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { SaveDoc } from './types';

const COLLECTION = 'saves';

function docId(userId: string, experienceId: string): string {
  return `${userId}_${experienceId}`;
}

function fromFirestore(data: DocumentData): SaveDoc {
  return { userId: data.userId, experienceId: data.experienceId, savedAt: toDate(data.savedAt) };
}

export const SaveRepository = {
  async save(userId: string, experienceId: string): Promise<void> {
    await setDoc(doc(db, COLLECTION, docId(userId, experienceId)), {
      userId,
      experienceId,
      savedAt: toTimestamp(new Date()),
    });
  },

  async unsave(userId: string, experienceId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, docId(userId, experienceId)));
  },

  async isSaved(userId: string, experienceId: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, docId(userId, experienceId)));
      return snap.exists();
    } catch {
      // The `saves` read rule can't evaluate against a missing doc on older
      // deployments — treat "can't read it" as "not saved" (a stale rules
      // set otherwise leaves the bookmark icon stuck after an un-save).
      return false;
    }
  },

  async listByUser(userId: string): Promise<SaveDoc[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.data()));
  },
};
