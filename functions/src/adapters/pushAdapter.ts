import * as admin from 'firebase-admin';
import { db as defaultDb, messaging as defaultMessaging } from '../adminApp';
import { PushSender } from '../lib/ports';

/**
 * FCM device tokens aren't part of the `User` interface in
 * technical_specification.md §3.1 — that schema is the product data
 * model, and a push token is pure delivery infrastructure. Rather than
 * add a field to `users/{uid}` (which the build brief says to implement
 * "exactly as defined"), tokens live in a `users/{uid}/fcmTokens/{token}`
 * subcollection, written by the client when it registers for push. If a
 * user has none, we log and no-op rather than fail the triggering write.
 */
export class FcmPushSender implements PushSender {
  constructor(
    private readonly db: FirebaseFirestore.Firestore = defaultDb,
    private readonly messaging: admin.messaging.Messaging = defaultMessaging,
  ) {}

  async sendToUser(
    userId: string,
    message: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    const tokensSnap = await this.db.collection('users').doc(userId).collection('fcmTokens').get();
    const tokens = tokensSnap.docs.map((doc) => doc.id);

    if (tokens.length === 0) {
      console.log(`FcmPushSender: no registered device for user ${userId}, skipping push`);
      return;
    }

    await this.messaging.sendEachForMulticast({
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
    });
  }
}
