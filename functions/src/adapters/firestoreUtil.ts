import * as admin from 'firebase-admin';

export function toDate(value: admin.firestore.Timestamp | Date | undefined, fallback: Date): Date {
  if (!value) return fallback;
  return value instanceof Date ? value : value.toDate();
}

export function toTimestamp(date: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(date);
}

/** Firestore's `in` / `array-contains-any` operators cap at 30 values. */
export const FIRESTORE_IN_LIMIT = 30;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
