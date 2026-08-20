/**
 * Repository for `notifications`. Notifications themselves are only ever
 * created server-side (Cloud Functions); the client's role is reading its
 * own list, marking read, and registering/unregistering an FCM device
 * token for push delivery (see functions/src/adapters/pushAdapter.ts).
 */
import { DocumentData, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/client';
import { toDate } from '../firebase/timestamps';
import { NotificationDoc } from './types';

const COLLECTION = 'notifications';

function fromFirestore(id: string, data: DocumentData): NotificationDoc {
  return {
    notificationId: id,
    recipientId: data.recipientId,
    type: data.type,
    payload: data.payload ?? {},
    read: data.read ?? false,
    createdAt: toDate(data.createdAt),
  };
}

export const NotificationRepository = {
  async listForRecipient(recipientId: string): Promise<NotificationDoc[]> {
    const q = query(
      collection(db, COLLECTION),
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async markRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, notificationId), { read: true });
  },

  async registerFcmToken(uid: string, token: string): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), { registeredAt: new Date().toISOString() });
  },

  async unregisterFcmToken(uid: string, token: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'fcmTokens', token));
  },
};
