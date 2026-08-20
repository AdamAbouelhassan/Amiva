/**
 * Social feed ranking — technical_specification.md §4.3.
 *
 * tier 1: isFriend && matchScore >= HIGH_THRESHOLD
 * tier 2: !isFriend && matchScore >= HIGH_THRESHOLD
 * tier 3: isFriend && matchScore < HIGH_THRESHOLD
 * tier 4: !isFriend && matchScore < HIGH_THRESHOLD
 *
 * Sort by tier ascending, then matchScore descending within tier, then
 * recency (createdAt descending).
 *
 * Pure/computable on either the client (for local re-sort of an already
 * fetched page) or a Cloud Function — the tier/comparator logic itself
 * carries no persisted state, unlike the decay algorithm.
 */
import { HIGH_MATCH_THRESHOLD } from './constants';

export type FeedTier = 1 | 2 | 3 | 4;

export interface FeedRankable {
  isFriend: boolean;
  /** Cosine similarity in [0, 1], not the rounded percent. */
  matchScore: number;
  createdAt: Date;
}

export function computeFeedTier(
  isFriend: boolean,
  matchScore: number,
  highThreshold: number = HIGH_MATCH_THRESHOLD,
): FeedTier {
  const highMatch = matchScore >= highThreshold;
  if (isFriend && highMatch) return 1;
  if (!isFriend && highMatch) return 2;
  if (isFriend && !highMatch) return 3;
  return 4;
}

export function feedComparator(
  highThreshold: number = HIGH_MATCH_THRESHOLD,
): (a: FeedRankable, b: FeedRankable) => number {
  return (a, b) => {
    const tierA = computeFeedTier(a.isFriend, a.matchScore, highThreshold);
    const tierB = computeFeedTier(b.isFriend, b.matchScore, highThreshold);
    if (tierA !== tierB) return tierA - tierB;
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return b.createdAt.getTime() - a.createdAt.getTime();
  };
}

export function sortFeed<T extends FeedRankable>(
  items: T[],
  highThreshold: number = HIGH_MATCH_THRESHOLD,
): T[] {
  return [...items].sort(feedComparator(highThreshold));
}
