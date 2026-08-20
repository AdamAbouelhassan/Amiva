import { Timestamp } from 'firebase/firestore';

export function toDate(value: Timestamp | Date | undefined, fallback: Date = new Date(0)): Date {
  if (!value) return fallback;
  return value instanceof Date ? value : value.toDate();
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}
