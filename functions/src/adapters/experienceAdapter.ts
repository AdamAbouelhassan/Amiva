import { TravelStyleVector } from '@amiva/core';
import { db as defaultDb } from '../adminApp';
import { FeedCandidate, FeedStore } from '../lib/feed';
import { ExperienceRecord, ExperienceStore } from '../lib/ports';
import { TrendingCandidate, TrendingStore } from '../lib/trending';
import { toDate } from './firestoreUtil';

/** Firestore's `in` operator caps at 30 values per query. */
const FIRESTORE_IN_LIMIT = 30;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export class FirestoreExperienceStore implements ExperienceStore, TrendingStore, FeedStore {
  constructor(private readonly db: FirebaseFirestore.Firestore = defaultDb) {}

  private col() {
    return this.db.collection('experiences');
  }

  async getExperience(experienceId: string): Promise<ExperienceRecord> {
    const snap = await this.col().doc(experienceId).get();
    if (!snap.exists) throw new Error(`FirestoreExperienceStore: experience ${experienceId} not found`);
    const data = snap.data()!;
    return {
      experienceId,
      ownerId: data.ownerId,
      tripId: data.tripId,
      placeId: data.placeId,
      categoryScores: data.categoryScores as TravelStyleVector,
      photoUrls: data.photoUrls ?? [],
      date: toDate(data.date, new Date(0)),
      rating: data.rating,
    };
  }

  async listRecentExperiences(
    locationFilter: { country?: string; city?: string },
    limit: number,
  ): Promise<TrendingCandidate[]> {
    let query: FirebaseFirestore.Query = this.col();
    if (locationFilter.country) query = query.where('country', '==', locationFilter.country);
    if (locationFilter.city) query = query.where('city', '==', locationFilter.city);
    query = query.orderBy('createdAt', 'desc').limit(limit);

    const snap = await query.get();
    return snap.docs.map((doc) => this.toTrendingCandidate(doc));
  }

  /** Feed's friend-pool fetch — batches over Firestore's 30-value `in`
   * cap so a caller with more friends than that still gets a correct
   * (if evenly-truncated-per-batch) result rather than an error. */
  async listByOwners(ownerIds: string[], limit: number): Promise<FeedCandidate[]> {
    if (ownerIds.length === 0) return [];
    const batches = await Promise.all(
      chunk(ownerIds, FIRESTORE_IN_LIMIT).map((batch) =>
        this.col().where('ownerId', 'in', batch).orderBy('createdAt', 'desc').limit(limit).get(),
      ),
    );
    return batches.flatMap((snap) => snap.docs.map((doc) => this.toFeedCandidate(doc)));
  }

  async listRecent(limit: number): Promise<FeedCandidate[]> {
    const snap = await this.col().orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((doc) => this.toFeedCandidate(doc));
  }

  private toTrendingCandidate(doc: FirebaseFirestore.QueryDocumentSnapshot): TrendingCandidate {
    const data = doc.data();
    return {
      experienceId: doc.id,
      ownerId: data.ownerId,
      title: data.title,
      city: data.city,
      country: data.country,
      categoryScores: data.categoryScores as TravelStyleVector,
      rating: data.rating,
      createdAt: toDate(data.createdAt, new Date(0)),
    };
  }

  private toFeedCandidate(doc: FirebaseFirestore.QueryDocumentSnapshot): FeedCandidate {
    const data = doc.data();
    return {
      experienceId: doc.id,
      ownerId: data.ownerId,
      title: data.title,
      city: data.city,
      country: data.country,
      categoryScores: data.categoryScores as TravelStyleVector,
      createdAt: toDate(data.createdAt, new Date(0)),
    };
  }
}
