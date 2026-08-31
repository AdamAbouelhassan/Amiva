/**
 * Repository for `savedPlaces` — saved raw Google Places from Discover >
 * Recommendations (Discover rebuild, 2026-08-30). Mirrors saveRepository.ts,
 * keyed by `{userId}_{placeId}` for the same reason `saves` is keyed by
 * `{userId}_{experienceId}`: idempotent save/unsave without a query.
 */
import { DocumentData, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { TravelStyleVector } from '@amiva/core';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { SavedPlaceDoc } from './types';

const COLLECTION = 'savedPlaces';

function docId(userId: string, placeId: string): string {
  return `${userId}_${placeId}`;
}

function fromFirestore(data: DocumentData): SavedPlaceDoc {
  return {
    userId: data.userId,
    placeId: data.placeId,
    name: data.name,
    country: data.country,
    city: data.city,
    lat: typeof data.lat === 'number' ? data.lat : undefined,
    lng: typeof data.lng === 'number' ? data.lng : undefined,
    photoRef: data.photoRef ?? undefined,
    categoryScores: data.categoryScores as TravelStyleVector,
    savedAt: toDate(data.savedAt),
  };
}

export const SavedPlaceRepository = {
  async save(input: {
    userId: string;
    placeId: string;
    name: string;
    country: string;
    city: string;
    lat?: number;
    lng?: number;
    photoRef?: string;
    categoryScores: TravelStyleVector;
  }): Promise<void> {
    await setDoc(doc(db, COLLECTION, docId(input.userId, input.placeId)), {
      userId: input.userId,
      placeId: input.placeId,
      name: input.name,
      country: input.country,
      city: input.city,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      photoRef: input.photoRef ?? null,
      categoryScores: input.categoryScores,
      savedAt: toTimestamp(new Date()),
    });
  },

  async unsave(userId: string, placeId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, docId(userId, placeId)));
  },

  async isSaved(userId: string, placeId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, COLLECTION, docId(userId, placeId)));
    return snap.exists();
  },

  /** No orderBy — small personal list, sorted client-side, so this
   * doesn't need its own composite index (the same query shape on `saves`
   * predates this and hasn't been fixed either — see saveRepository.ts's
   * listByUser; not repeating that gap here). */
  async listByUser(userId: string): Promise<SavedPlaceDoc[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.data())).sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
  },
};
