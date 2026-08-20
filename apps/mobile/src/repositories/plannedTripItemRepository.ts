/**
 * Repository for `plannedTripItems` — the unordered itinerary
 * checklist for a planned trip (functional_specification.md §4.2: "no
 * day-by-day time-slot scheduling").
 */
import {
  DocumentData,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { TravelStyleVector } from '@amiva/core';
import { db } from '../firebase/client';
import { PlannedTripItemDoc } from './types';
import { PlannedTripRepository } from './plannedTripRepository';

const COLLECTION = 'plannedTripItems';

function fromFirestore(id: string, data: DocumentData): PlannedTripItemDoc {
  return {
    itemId: id,
    plannedTripId: data.plannedTripId,
    source: data.source,
    placeId: data.placeId,
    title: data.title,
    categoryScores: data.categoryScores,
    completed: data.completed ?? false,
    convertedToExperienceId: data.convertedToExperienceId,
  };
}

export const PlannedTripItemRepository = {
  async getById(itemId: string): Promise<PlannedTripItemDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, itemId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  async listByPlannedTrip(plannedTripId: string): Promise<PlannedTripItemDoc[]> {
    const q = query(collection(db, COLLECTION), where('plannedTripId', '==', plannedTripId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  /** Added from saved experiences or recommendations, in that priority
   * order (functional_specification.md §4.2). */
  async create(input: {
    plannedTripId: string;
    source: 'saved' | 'recommended';
    placeId: string;
    title: string;
    categoryScores?: TravelStyleVector;
  }): Promise<PlannedTripItemDoc> {
    const ref = doc(collection(db, COLLECTION));
    const item: PlannedTripItemDoc = { itemId: ref.id, completed: false, ...input };
    await setDoc(ref, {
      plannedTripId: item.plannedTripId,
      source: item.source,
      placeId: item.placeId,
      title: item.title,
      categoryScores: item.categoryScores ?? null,
      completed: false,
    });
    await PlannedTripRepository.addItemId(input.plannedTripId, ref.id);
    return item;
  },

  async setCompleted(itemId: string, completed: boolean): Promise<void> {
    await updateDoc(doc(db, COLLECTION, itemId), { completed });
  },

  async delete(itemId: string, plannedTripId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, itemId));
    await PlannedTripRepository.removeItemId(plannedTripId, itemId);
  },
};
