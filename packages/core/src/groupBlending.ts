/**
 * Group recommendation blending — technical_specification.md §4.4,
 * functional_specification.md §6.2.
 *
 * For a planned trip with N collaborators, and a candidate experience:
 *   1. Compute each collaborator's individual match score against it.
 *   2. Compute group cohesion = variance across those N scores.
 *   3. variance <= threshold -> one blended recommendation (average vector).
 *   4. variance >  threshold -> segmented per-collaborator recommendations,
 *      surfacing the trade-off rather than forcing a flattened compromise.
 */
import { GROUP_VARIANCE_THRESHOLD } from './constants';
import { MatchScorer, defaultMatchScorer } from './matchScorer';
import { TRAVEL_STYLE_CATEGORIES, TravelStyleVector } from './types';

export interface Collaborator {
  collaboratorId: string;
  travelStyle: TravelStyleVector;
}

export interface BlendedGroupRecommendation {
  type: 'blended';
  /** Average travel style vector across all collaborators. */
  groupVector: TravelStyleVector;
  matchScore: number;
  variance: number;
}

export interface SegmentedGroupRecommendation {
  type: 'segmented';
  variance: number;
  perCollaborator: Array<{ collaboratorId: string; matchScore: number }>;
}

export type GroupRecommendation = BlendedGroupRecommendation | SegmentedGroupRecommendation;

/** Population variance (not sample variance) of a set of match scores —
 * there's no sampling going on, we have every collaborator's score. */
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

export function averageVectors(vectors: TravelStyleVector[]): TravelStyleVector {
  if (vectors.length === 0) {
    throw new Error('averageVectors: at least one vector is required');
  }
  const result = {} as TravelStyleVector;
  for (const category of TRAVEL_STYLE_CATEGORIES) {
    const sum = vectors.reduce((acc, v) => acc + v[category], 0);
    result[category] = sum / vectors.length;
  }
  return result;
}

export function computeGroupRecommendation(
  collaborators: Collaborator[],
  candidateVector: TravelStyleVector,
  options: {
    varianceThreshold?: number;
    matchScorer?: MatchScorer;
  } = {},
): GroupRecommendation {
  if (collaborators.length === 0) {
    throw new Error('computeGroupRecommendation: at least one collaborator is required');
  }
  const threshold = options.varianceThreshold ?? GROUP_VARIANCE_THRESHOLD;
  const scorer = options.matchScorer ?? defaultMatchScorer;

  const individualScores = collaborators.map((c) => ({
    collaboratorId: c.collaboratorId,
    matchScore: scorer.score(c.travelStyle, candidateVector),
  }));
  const groupVariance = variance(individualScores.map((s) => s.matchScore));

  if (groupVariance <= threshold) {
    const groupVector = averageVectors(collaborators.map((c) => c.travelStyle));
    return {
      type: 'blended',
      groupVector,
      matchScore: scorer.score(groupVector, candidateVector),
      variance: groupVariance,
    };
  }

  return {
    type: 'segmented',
    variance: groupVariance,
    perCollaborator: individualScores,
  };
}
