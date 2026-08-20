import { db as defaultDb } from '../adminApp';
import { NotificationRecord, NotificationStore } from '../lib/ports';
import { toTimestamp } from './firestoreUtil';

export class FirestoreNotificationStore implements NotificationStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('notifications');
  }

  async createNotification(input: Omit<NotificationRecord, 'notificationId' | 'read'>): Promise<string> {
    const ref = this.col().doc();
    await ref.set({
      recipientId: input.recipientId,
      type: input.type,
      payload: input.payload,
      read: false,
      createdAt: toTimestamp(input.createdAt),
    });
    return ref.id;
  }
}
