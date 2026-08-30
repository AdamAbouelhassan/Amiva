/**
 * Backs the `computeMatchScore` callable (technical_specification.md §5):
 * "On-demand similarity computation (e.g., previewing a match before data
 * is persisted)." Used identically for User↔Experience, User↔User, and
 * raw-vector previews (functional_specification.md §2.6).
 */
import { defaultMatchScorer, MatchScorer, toMatchPercent, TravelStyleVector } from '@amiva/core';
import { ExperienceStore, UserStore } from './ports';

export type MatchSubject =
  | { type: 'vector'; vector: TravelStyleVector }
  | { type: 'user'; userId: string }
  | { type: 'experience'; experienceId: string };

export interface ComputeMatchScoreResult {
  similarity: number;
  matchPercent: number;
}

async function resolveVector(
  subject: MatchSubject,
  stores: { userStore: UserStore; experienceStore: ExperienceStore },
): Promise<TravelStyleVector> {
  switch (subject.type) {
    case 'vector':
      return subject.vector;
    case 'user':
      return (await stores.userStore.getUserStyle(subject.userId)).travelStyle;
    case 'experience':
      return (await stores.experienceStore.getExperience(subject.experienceId)).categoryScores;
  }
}

export async function computeMatchScore(
  a: MatchSubject,
  b: MatchSubject,
  stores: { userStore: UserStore; experienceStore: ExperienceStore },
  scorer: MatchScorer = defaultMatchScorer,
): Promise<ComputeMatchScoreResult> {
  const [vectorA, vectorB] = await Promise.all([resolveVector(a, stores), resolveVector(b, stores)]);
  const similarity = scorer.score(vectorA, vectorB);
  return { similarity, matchPercent: toMatchPercent(similarity) };
}
