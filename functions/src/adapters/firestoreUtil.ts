import * as admin from 'firebase-admin';

export function toDate(value: admin.firestore.Timestamp | Date | undefined, fallback: Date): Date {
  if (!value) return fallback;
  return value instanceof Date ? value : value.toDate();
}

export function toTimestamp(date: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(date);
}
