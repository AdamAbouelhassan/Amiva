/**
 * Repository for `plannedTrips` (Planner) — shared-doc-style collaboration
 * (functional_specification.md §6.1): any collaborator can update the
 * itinerary directly, no invite/accept step.
 */
import {
  DocumentData,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { PlannedTripDoc, PlannedTripStatus, PrivacySetting } from './types';

const COLLECTION = 'plannedTrips';

function fromFirestore(id: string, data: DocumentData): PlannedTripDoc {
  return {
    plannedTripId: id,
    ownerId: data.ownerId,
    collaboratorIds: data.collaboratorIds ?? [],
    locations: data.locations ?? [],
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    status: data.status,
    visibility: data.visibility,
    itemIds: data.itemIds ?? [],
    createdAt: toDate(data.createdAt),
  };
}

export const PlannedTripRepository = {
  async getById(plannedTripId: string): Promise<PlannedTripDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, plannedTripId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  /** Overview of every planned trip the user owns or collaborates on
   * (functional_specification.md §4.1: "multiple trips concurrently"). */
  async listForUser(userId: string): Promise<PlannedTripDoc[]> {
    const [ownedSnap, collabSnap] = await Promise.all([
      getDocs(query(collection(db, COLLECTION), where('ownerId', '==', userId), orderBy('startDate', 'asc'))),
      getDocs(query(collection(db, COLLECTION), where('collaboratorIds', 'array-contains', userId))),
    ]);
    const byId = new Map<string, PlannedTripDoc>();
    for (const d of [...ownedSnap.docs, ...collabSnap.docs]) {
      byId.set(d.id, fromFirestore(d.id, d.data()));
    }
    return [...byId.values()].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  },

  async create(input: {
    ownerId: string;
    locations: string[];
    startDate: Date;
    endDate: Date;
    visibility: PrivacySetting;
  }): Promise<PlannedTripDoc> {
    const ref = doc(collection(db, COLLECTION));
    const trip: PlannedTripDoc = {
      plannedTripId: ref.id,
      ownerId: input.ownerId,
      collaboratorIds: [],
      locations: input.locations,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'planning',
      visibility: input.visibility,
      itemIds: [],
      createdAt: new Date(),
    };
    await setDoc(ref, {
      ownerId: trip.ownerId,
      collaboratorIds: trip.collaboratorIds,
      locations: trip.locations,
      startDate: toTimestamp(trip.startDate),
      endDate: toTimestamp(trip.endDate),
      status: trip.status,
      visibility: trip.visibility,
      itemIds: trip.itemIds,
      createdAt: toTimestamp(trip.createdAt),
    });
    return trip;
  },

  async setStatus(plannedTripId: string, status: PlannedTripStatus): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { status });
  },

  /** Direct-add, no invite/accept step (functional_specification.md §6.1/§6.3). */
  async addCollaborator(plannedTripId: string, collaboratorId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { collaboratorIds: arrayUnion(collaboratorId) });
  },

  async removeCollaborator(plannedTripId: string, collaboratorId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { collaboratorIds: arrayRemove(collaboratorId) });
  },

  async addItemId(plannedTripId: string, itemId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { itemIds: arrayUnion(itemId) });
  },

  async removeItemId(plannedTripId: string, itemId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { itemIds: arrayRemove(itemId) });
  },

  async updateDateRange(plannedTripId: string, startDate: Date, endDate: Date): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), {
      startDate: toTimestamp(startDate),
      endDate: toTimestamp(endDate),
    });
  },

  async setVisibility(plannedTripId: string, visibility: PrivacySetting): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { visibility });
  },
};
