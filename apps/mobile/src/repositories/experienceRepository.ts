/**
 * Repository for `experiences` (Logbook entries / posts) — the biggest
 * collection in terms of query variety (drill-down, feed, trending
 * candidates, trip recategorization).
 */
import {
  DocumentData,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { MAX_EXPERIENCE_PHOTOS, TravelStyleVector } from '@amiva/core';
import { db } from '../firebase/client';
import { toDate, toTimestamp } from '../firebase/timestamps';
import { ExperienceDoc, PlaceDoc } from './types';
import { PlaceRepository } from './placeRepository';

const COLLECTION = 'experiences';

function fromFirestore(id: string, data: DocumentData): ExperienceDoc {
  return {
    experienceId: id,
    ownerId: data.ownerId,
    tripId: data.tripId ?? undefined,
    placeId: data.placeId,
    city: data.city,
    country: data.country,
    title: data.title,
    notes: data.notes ?? '',
    rating: data.rating,
    photoUrls: data.photoUrls ?? [],
    categoryScores: data.categoryScores as TravelStyleVector,
    date: toDate(data.date),
    dateSource: data.dateSource,
    postType: data.postType,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export interface CreateExperienceInput {
  ownerId: string;
  place: Omit<PlaceDoc, 'createdAt'>;
  /** Explicit trip to attach to; omitted = standalone. Experiences are
   * attached to trips explicitly by the user (2026-08 restructure). */
  tripId?: string;
  title: string;
  notes: string;
  rating: number;
  photoUrls: string[];
  categoryScores: TravelStyleVector;
  date: Date;
  dateSource: 'exif' | 'manual';
  postType?: ExperienceDoc['postType'];
}

export const ExperienceRepository = {
  async getById(experienceId: string): Promise<ExperienceDoc | undefined> {
    const snap = await getDoc(doc(db, COLLECTION, experienceId));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : undefined;
  },

  /** A trip's experiences. Needs the `ownerId` filter (not just `tripId`)
   * so firestore.rules can prove the query is the owner reading their own
   * docs — the `experiences` read rule does a per-doc `get(users/…)` that
   * can't be evaluated for a bare `tripId ==` collection query. Sorted
   * client-side to avoid a 3-field composite index. */
  async listByTrip(tripId: string, ownerId: string): Promise<ExperienceDoc[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      where('tripId', '==', tripId),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  /** Logbook drill-down: every experience for an owner, most recent
   * first — the caller groups these client-side into Country > City. */
  async listByOwner(ownerId: string): Promise<ExperienceDoc[]> {
    const q = query(collection(db, COLLECTION), where('ownerId', '==', ownerId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async listByOwnerCountryCity(ownerId: string, country: string, city: string): Promise<ExperienceDoc[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      where('country', '==', country),
      where('city', '==', city),
      orderBy('date', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  /** Recent posts across all users, for the Discovery feed — match-score
   * ranking and friend-tiering are applied client-side in
   * useFeed (feedRanking from @amiva/core) over this page of results. */
  async listRecentForFeed(pageSize = 50): Promise<ExperienceDoc[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), fsLimit(pageSize));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  /** Attach an experience to a trip, or detach it (tripId = null). */
  async setTrip(experienceId: string, tripId: string | null): Promise<void> {
    await updateDoc(doc(db, COLLECTION, experienceId), { tripId });
  },

  async create(input: CreateExperienceInput): Promise<ExperienceDoc> {
    if (input.photoUrls.length > MAX_EXPERIENCE_PHOTOS) {
      throw new Error(`An experience can have at most ${MAX_EXPERIENCE_PHOTOS} photos.`);
    }

    await PlaceRepository.upsertFromGooglePlace(input.place);

    const tripId = input.tripId;

    const ref = doc(collection(db, COLLECTION));
    const now = new Date();
    const experience: ExperienceDoc = {
      experienceId: ref.id,
      ownerId: input.ownerId,
      tripId,
      placeId: input.place.placeId,
      city: input.place.city,
      country: input.place.country,
      title: input.title,
      notes: input.notes,
      rating: input.rating,
      photoUrls: input.photoUrls,
      categoryScores: input.categoryScores,
      date: input.date,
      dateSource: input.dateSource,
      postType: input.postType ?? 'experience',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(ref, {
      ownerId: experience.ownerId,
      tripId: experience.tripId ?? null,
      placeId: experience.placeId,
      city: experience.city,
      country: experience.country,
      title: experience.title,
      notes: experience.notes,
      rating: experience.rating,
      photoUrls: experience.photoUrls,
      categoryScores: experience.categoryScores,
      date: toTimestamp(experience.date),
      dateSource: experience.dateSource,
      postType: experience.postType,
      createdAt: toTimestamp(experience.createdAt),
      updatedAt: toTimestamp(experience.updatedAt),
    });

    return experience;
  },

  async update(
    experienceId: string,
    patch: Partial<
      Pick<ExperienceDoc, 'title' | 'notes' | 'rating' | 'photoUrls' | 'categoryScores' | 'date' | 'dateSource'>
    >,
  ): Promise<void> {
    const { date, ...rest } = patch;
    await updateDoc(doc(db, COLLECTION, experienceId), {
      ...rest,
      ...(date ? { date: toTimestamp(date) } : {}),
      updatedAt: toTimestamp(new Date()),
    });
  },

  async delete(experienceId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, experienceId));
  },
};
