/**
 * Single Firebase Admin SDK initialization, shared by every adapter and
 * trigger. Nothing else in this package should call `admin.initializeApp`.
 */
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const messaging = admin.messaging();
export { admin };
