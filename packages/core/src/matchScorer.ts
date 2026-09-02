/**
 * Match scoring — Strategy pattern (CLAUDE.md #3, technical_specification.md
 * §8). Cosine similarity is the MVP strategy, accessed only through the
 * MatchScorer interface so the algorithm can be swapped later without
 * touching call sites in the client or Cloud Functions.
 *
 * Used identically for User↔Experience, User↔User, and Group↔Experience
 * (functional_specification.md §2.6).
 */
import { CATEGORY_IDS, TravelStyleVector } from './types';

export interface MatchScorer {
  /** Returns similarity in [0, 1] for two travel style vectors (category
   * scores are non-negative, so cosine similarity is naturally
   * non-negative here — technical_specification.md §4.1). */
  score(a: TravelStyleVector, b: TravelStyleVector): number;
}

/** Converts a TravelStyleVector into a plain ordered number[] using the
 * canonical category order, for numeric vector math. */
export function toOrderedArray(vector: TravelStyleVector): number[] {
  return CATEGORY_IDS.map((category) => vector[category]);
}

/** Pure cosine similarity between two equal-length numeric vectors.
 * `similarity(A, B) = (A · B) / (||A|| × ||B||)` (technical_specification.md
 * §4.1). Returns 0 if either vector has zero magnitude (undefined
 * direction) rather than NaN, so a brand-new all-zero vector never breaks
 * downstream percentage math. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`cosineSimilarity: vector length mismatch (${a.length} vs ${b.length})`);
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Converts a raw similarity in [0,1] to the displayed percentage:
 * `matchPercent = round(similarity * 100)` (technical_specification.md
 * §4.1). */
export function toMatchPercent(similarity: number): number {
  return Math.round(similarity * 100);
}

/** MVP strategy implementation: cosine similarity over TravelStyleVectors. */
export class CosineSimilarityMatchScorer implements MatchScorer {
  score(a: TravelStyleVector, b: TravelStyleVector): number {
    return cosineSimilarity(toOrderedArray(a), toOrderedArray(b));
  }
}

/** Shared default instance — import this everywhere a match score is
 * needed instead of constructing a new scorer or inlining the cosine
 * formula (CLAUDE.md #3). */
export const defaultMatchScorer: MatchScorer = new CosineSimilarityMatchScorer();
