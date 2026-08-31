/**
 * Repository for `trips` (Logbook — past trips). As of the 2026-08
 * restructure a Trip is a plain user-authored container: one location,
 * optional date range, name, notes, accommodation, photos, and
 * explicitly-attached experiences. No auto-categorization.
 */
import {
  DocumentData,
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
import { TripDoc } from './types';

const COLLECTION = 'trips';

function fromFirestore(id: string, data: DocumentData): TripDoc {
  return {
    tripId: id,
    ownerId: data.ownerId,
    location: data.location ?? '',
    country: data.country ?? '',
    city: data.city ?? undefined,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    name: data.name ?? '',
    notes: data.notes ?? undefined,
    accommodation: data.accommodation ?? undefined,
    photoUrls: data.photoUrls ?? [],
    coverPhotoUrl: data.coverPhotoUrl ?? '',
    visibility: data.visibility,
    createdAt: toDate(data.createdAt),
  };
}

export interface CreateTripInput {
  ownerId: string;
  location: string;
  country: string;
  city?: string;
  startDate: Date;
  endDate: Date;
  /** Falls back to generateTripName(location, range) when omitted/blank. */
  name?: string;
  notes?: string;
  accommodation?: string;
  photoUrls?: string[];
  visibility: TripDoc['visibility'];
}

export type UpdateTripPatch = Partial<
  Pick<
    TripDoc,
    'name' | 'notes' | 'accommodation' | 'photoUrls' | 'coverPhotoUrl' | 'location' | 'country' | 'startDate' | 'endDate'
  >
> & {
  /** `null` clears a previously-set city. */
  city?: string | null;
};

export const TripRepository = {
  async getById(tripId: string): Promise<TripDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, tripId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  async listByOwner(ownerId: string): Promise<TripDoc[]> {
    const q = query(collection(db, COLLECTION), where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async create(input: CreateTripInput): Promise<TripDoc> {
    const ref = doc(collection(db, COLLECTION));
    const name =
      input.name?.trim() ||
      generateTripName(input.location, { startDate: input.startDate, endDate: input.endDate });

    const trip: TripDoc = {
      tripId: ref.id,
      ownerId: input.ownerId,
      location: input.location,
      country: input.country,
      city: input.city,
      startDate: input.startDate,
      endDate: input.endDate,
      name,
      notes: input.notes,
      accommodation: input.accommodation,
      photoUrls: input.photoUrls ?? [],
      coverPhotoUrl: input.photoUrls?.[0] ?? '',
      visibility: input.visibility,
      createdAt: new Date(),
    };

    await setDoc(ref, {
      ownerId: trip.ownerId,
      location: trip.location,
      country: trip.country,
      city: trip.city ?? null,
      startDate: toTimestamp(trip.startDate),
      endDate: toTimestamp(trip.endDate),
      name: trip.name,
      notes: trip.notes ?? null,
      accommodation: trip.accommodation ?? null,
      photoUrls: trip.photoUrls,
      coverPhotoUrl: trip.coverPhotoUrl,
      visibility: trip.visibility,
      createdAt: toTimestamp(trip.createdAt),
    });
    return trip;
  },

  async update(tripId: string, patch: UpdateTripPatch): Promise<void> {
    const { startDate, endDate, ...rest } = patch;
    await updateDoc(doc(db, COLLECTION, tripId), {
      ...rest,
      ...(startDate ? { startDate: toTimestamp(startDate) } : {}),
      ...(endDate ? { endDate: toTimestamp(endDate) } : {}),
    });
  },

  async renameManually(tripId: string, name: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, tripId), { name });
  },

  async setCoverPhotoManually(tripId: string, coverPhotoUrl: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, tripId), { coverPhotoUrl });
  },

  /** Deletes the trip. Experiences attached to it are detached (tripId →
   * null), never deleted — they survive as standalone logbook entries. The
   * `ownerId` filter is required for the query to pass firestore.rules
   * (see ExperienceRepository.listByTrip). */
  async delete(tripId: string, ownerId: string): Promise<void> {
    const attached = await getDocs(
      query(collection(db, 'experiences'), where('ownerId', '==', ownerId), where('tripId', '==', tripId)),
    );
    if (!attached.empty) {
      const batch = writeBatch(db);
      attached.docs.forEach((d) => batch.update(d.ref, { tripId: null }));
      await batch.commit();
    }
    await deleteDoc(doc(db, COLLECTION, tripId));
  },
};
