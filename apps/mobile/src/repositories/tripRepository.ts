/**
 * Repository for `trips` (Logbook — past trips), plus the date-range-edit
 * recategorization flow (functional_specification.md §3.2) built on top
 * of the pure rule in @amiva/core.
 */
import {
  DocumentData,
  collection,
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
import { computeTripRecategorization, generateTripName, TripForCategorization } from '@amiva/core';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { TripDoc } from './types';
import { ExperienceRepository } from './experienceRepository';

const COLLECTION = 'trips';

function fromFirestore(id: string, data: DocumentData): TripDoc {
  return {
    tripId: id,
    ownerId: data.ownerId,
    countries: data.countries,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    name: data.name,
    coverPhotoUrl: data.coverPhotoUrl ?? '',
    visibility: data.visibility,
    createdAt: toDate(data.createdAt),
  };
}

export const TripRepository = {
  async getById(tripId: string): Promise<TripDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, tripId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  async listByOwner(ownerId: string): Promise<TripDoc[]> {
    const q = query(collection(db, COLLECTION), where('ownerId', '==', ownerId), orderBy('startDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async listByOwnerAndCountry(ownerId: string, country: string): Promise<TripDoc[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      where('countries', 'array-contains', country),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async create(input: {
    ownerId: string;
    countries: string[];
    startDate: Date;
    endDate: Date;
    visibility: TripDoc['visibility'];
  }): Promise<TripDoc> {
    const ref = doc(collection(db, COLLECTION));
    const trip: TripDoc = {
      tripId: ref.id,
      ownerId: input.ownerId,
      countries: input.countries,
      startDate: input.startDate,
      endDate: input.endDate,
      name: generateTripName(input.countries, { startDate: input.startDate, endDate: input.endDate }),
      coverPhotoUrl: '',
      visibility: input.visibility,
      createdAt: new Date(),
    };
    await setDoc(ref, {
      ownerId: trip.ownerId,
      countries: trip.countries,
      startDate: toTimestamp(trip.startDate),
      endDate: toTimestamp(trip.endDate),
      name: trip.name,
      coverPhotoUrl: trip.coverPhotoUrl,
      visibility: trip.visibility,
      createdAt: toTimestamp(trip.createdAt),
    });
    return trip;
  },

  async renameManually(tripId: string, name: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, tripId), { name });
  },

  async setCoverPhotoManually(tripId: string, coverPhotoUrl: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, tripId), { coverPhotoUrl });
  },

  /** Edits a trip's date range, then recategorizes candidate experiences
   * (same country, currently in this trip or standalone) into/out of it,
   * per functional_specification.md §3.2. The trip's auto-generated name
   * is *not* regenerated here — once a user has seen/kept a name it's
   * treated as theirs; call `renameManually` if a fresh auto-name is
   * wanted. */
  async updateDateRange(tripId: string, startDate: Date, endDate: Date): Promise<void> {
    const trip = await this.getById(tripId);
    if (!trip) throw new Error(`Trip ${tripId} not found`);

    await updateDoc(doc(db, COLLECTION, tripId), {
      startDate: toTimestamp(startDate),
      endDate: toTimestamp(endDate),
    });

    const updatedTrip: TripForCategorization = { tripId, countries: trip.countries, startDate, endDate };

    for (const country of trip.countries) {
      const candidates = await ExperienceRepository.listCategorizationCandidates(trip.ownerId, country, tripId);
      const { toAdd, toRemove } = computeTripRecategorization(updatedTrip, candidates);
      if (toAdd.length === 0 && toRemove.length === 0) continue;

      const batch = writeBatch(db);
      for (const experienceId of toAdd) {
        batch.update(doc(db, 'experiences', experienceId), { tripId });
      }
      for (const experienceId of toRemove) {
        batch.update(doc(db, 'experiences', experienceId), { tripId: null });
      }
      await batch.commit();
    }
  },
};
