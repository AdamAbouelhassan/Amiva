/**
 * Repository for `plannedTrips` (Planner) — shared-doc-style collaboration
 * (functional_specification.md §6.1): any collaborator can update the
 * itinerary directly, no invite/accept step.
 *
 * As of the 2026-08 restructure a planned trip carries the same field shape
 * as a Logbook trip (one location, optional dates, name, notes,
 * accommodation, photos) plus its Planner extras (collaborators, status,
 * itinerary items).
 */
import {
  DocumentData,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { generateTripName } from '@amiva/core';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { PlannedTripDoc, PlannedTripStatus, PrivacySetting } from './types';

const COLLECTION = 'plannedTrips';

function fromFirestore(id: string, data: DocumentData): PlannedTripDoc {
  return {
    plannedTripId: id,
    ownerId: data.ownerId,
    collaboratorIds: data.collaboratorIds ?? [],
    location: data.location ?? '',
    country: data.country ?? '',
    city: data.city ?? undefined,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    name: data.name ?? '',
    notes: data.notes ?? undefined,
    accommodation: data.accommodation ?? undefined,
    photoUrls: data.photoUrls ?? [],
    status: data.status,
    visibility: data.visibility,
    itemIds: data.itemIds ?? [],
    createdAt: toDate(data.createdAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : undefined,
    convertedToTripId: data.convertedToTripId ?? undefined,
  };
}

export interface CreatePlannedTripInput {
  ownerId: string;
  location: string;
  country: string;
  city?: string;
  startDate: Date;
  endDate: Date;
  name?: string;
  notes?: string;
  accommodation?: string;
  photoUrls?: string[];
  visibility: PrivacySetting;
}

export type UpdatePlannedTripPatch = Partial<
  Pick<
    PlannedTripDoc,
    'name' | 'notes' | 'accommodation' | 'photoUrls' | 'location' | 'country' | 'startDate' | 'endDate' | 'visibility'
  >
> & {
  /** `null` clears a previously-set city. */
  city?: string | null;
};

export const PlannedTripRepository = {
  async getById(plannedTripId: string): Promise<PlannedTripDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, plannedTripId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  /** Every planned trip the user owns or collaborates on
   * (functional_specification.md §4.1: "multiple trips concurrently"),
   * soonest start date first. Sorted client-side — the query order only
   * needs to pull the docs. */
  async listForUser(userId: string): Promise<PlannedTripDoc[]> {
    const [ownedSnap, collabSnap] = await Promise.all([
      getDocs(query(collection(db, COLLECTION), where('ownerId', '==', userId), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, COLLECTION), where('collaboratorIds', 'array-contains', userId))),
    ]);
    const byId = new Map<string, PlannedTripDoc>();
    for (const d of [...ownedSnap.docs, ...collabSnap.docs]) {
      byId.set(d.id, fromFirestore(d.id, d.data()));
    }
    return [...byId.values()].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  },

  async create(input: CreatePlannedTripInput): Promise<PlannedTripDoc> {
    const ref = doc(collection(db, COLLECTION));
    const name =
      input.name?.trim() ||
      generateTripName(input.location, { startDate: input.startDate, endDate: input.endDate });

    const trip: PlannedTripDoc = {
      plannedTripId: ref.id,
      ownerId: input.ownerId,
      collaboratorIds: [],
      location: input.location,
      country: input.country,
      city: input.city,
      startDate: input.startDate,
      endDate: input.endDate,
      name,
      notes: input.notes,
      accommodation: input.accommodation,
      photoUrls: input.photoUrls ?? [],
      status: 'planning',
      visibility: input.visibility,
      itemIds: [],
      createdAt: new Date(),
    };

    await setDoc(ref, {
      ownerId: trip.ownerId,
      collaboratorIds: trip.collaboratorIds,
      location: trip.location,
      country: trip.country,
      city: trip.city ?? null,
      startDate: toTimestamp(trip.startDate),
      endDate: toTimestamp(trip.endDate),
      name: trip.name,
      notes: trip.notes ?? null,
      accommodation: trip.accommodation ?? null,
      photoUrls: trip.photoUrls,
      status: trip.status,
      visibility: trip.visibility,
      itemIds: trip.itemIds,
      createdAt: toTimestamp(trip.createdAt),
    });
    return trip;
  },

  async update(plannedTripId: string, patch: UpdatePlannedTripPatch): Promise<void> {
    const { startDate, endDate, ...rest } = patch;
    await updateDoc(doc(db, COLLECTION, plannedTripId), {
      ...rest,
      ...(startDate ? { startDate: toTimestamp(startDate) } : {}),
      ...(endDate ? { endDate: toTimestamp(endDate) } : {}),
    });
  },

  async setStatus(plannedTripId: string, status: PlannedTripStatus): Promise<void> {
    // Stamp completedAt so the Friends activity feed has a timestamp to
    // sort a "completed a trip" event by.
    const patch: Record<string, unknown> = { status };
    if (status === 'completed') patch.completedAt = toTimestamp(new Date());
    await updateDoc(doc(db, COLLECTION, plannedTripId), patch);
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

  async setVisibility(plannedTripId: string, visibility: PrivacySetting): Promise<void> {
    await updateDoc(doc(db, COLLECTION, plannedTripId), { visibility });
  },

  /** Deletes the plan and its itinerary items. A Logbook trip a completed
   * plan produced is left alone — delete that separately from the Logbook. */
  async delete(plannedTripId: string): Promise<void> {
    const items = await getDocs(
      query(collection(db, 'plannedTripItems'), where('plannedTripId', '==', plannedTripId)),
    );
    if (!items.empty) {
      const batch = writeBatch(db);
      items.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, COLLECTION, plannedTripId));
  },
};
