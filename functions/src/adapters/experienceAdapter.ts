import { TravelStyleVector } from '@amiva/core';
import { db as defaultDb } from '../adminApp';
import { ExperienceRecord, ExperienceStore } from '../lib/ports';
import { TrendingCandidate, TrendingStore } from '../lib/trending';
import { toDate } from './firestoreUtil';

export class FirestoreExperienceStore implements ExperienceStore, TrendingStore {
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
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        experienceId: doc.id,
        categoryScores: data.categoryScores as TravelStyleVector,
        rating: data.rating,
        createdAt: toDate(data.createdAt, new Date(0)),
      };
    });
  }
}
