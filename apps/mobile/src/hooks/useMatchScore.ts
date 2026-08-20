/**
 * Match scoring hooks — CLAUDE.md principle #2: the client may compute a
 * similarity score locally for instant preview UI, but the persisted,
 * displayed-everywhere-else value always comes from the server
 * (`computeMatchScore` Cloud Function). Two hooks, two purposes:
 *
 *  - usePreviewMatchScore: synchronous, local, for live UI (e.g. dragging
 *    onboarding sliders and seeing an estimate update before saving).
 *  - useMatchScore: server round-trip via the `computeMatchScore`
 *    callable — the source of truth for anything shown to *other* users
 *    (feed match %, compatibility %).
 */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { useMemo } from 'react';
import { defaultMatchScorer, TravelStyleVector } from '@amiva/core';
import { functions } from '../firebase/client';

export function usePreviewMatchScore(a: TravelStyleVector, b: TravelStyleVector): number {
  return useMemo(() => defaultMatchScorer.score(a, b), [a, b]);
}

export type MatchSubject =
  | { type: 'vector'; vector: TravelStyleVector }
  | { type: 'user'; userId: string }
  | { type: 'experience'; experienceId: string };

interface ComputeMatchScoreResult {
  similarity: number;
  matchPercent: number;
}

const computeMatchScoreCallable = httpsCallable<{ a: MatchSubject; b: MatchSubject }, ComputeMatchScoreResult>(
  functions,
  'computeMatchScore',
);

export function useMatchScore(a: MatchSubject | undefined, b: MatchSubject | undefined) {
  return useQuery({
    queryKey: ['matchScore', a, b],
    queryFn: async () => {
      const result = await computeMatchScoreCallable({ a: a!, b: b! });
      return result.data;
    },
    enabled: !!a && !!b,
  });
}
