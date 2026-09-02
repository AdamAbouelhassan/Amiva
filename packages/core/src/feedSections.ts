/**
 * Groups Feed/Trending content into sections keyed by the viewer's own top
 * travel-style categories ("organized by the activities that most match
 * your personal travel style" — Discover rebuild, 2026-08-30). Reuses
 * topCategories (profileInsights.ts) for section headers; within-section
 * ordering is caller-supplied (Feed passes feedComparator's friend-tier
 * ranking, Trending passes its own popularity ranking — this function has
 * no opinion on which).
 *
 * An item can appear in more than one section if it scores highly across
 * multiple categories (functional_specification.md §2.5's own example: a
 * food tour scores high on both Luxury and Foodie) — duplicates across
 * sections are an accepted product decision here, not a bug.
 */
import { CATEGORY_SECTION_THRESHOLD, FEED_SECTION_COUNT } from './constants';
import { topCategories } from './profileInsights';
import { CategoryId, TravelStyleVector } from './types';

export interface SectionableItem {
  categoryScores: TravelStyleVector;
}

export interface FeedSection<T> {
  category: CategoryId;
  items: T[];
}

export interface SectionByTopCategoriesOptions<T> {
  /** How many of the viewer's top categories become sections. Defaults to
   * FEED_SECTION_COUNT. */
  sectionCount?: number;
  /** Minimum categoryScores[category] (0-10) for an item to belong to that
   * category's section. Defaults to CATEGORY_SECTION_THRESHOLD. */
  categoryThreshold?: number;
  /** Comparator used to order items within each section — e.g. Feed
   * passes feedComparator (friend-tier, then match score, then recency);
   * Trending passes its own trendingScore-descending comparator. Required:
   * this function makes no assumption about what "best" means for a given
   * item shape beyond its categoryScores. */
  sort: (a: T, b: T) => number;
}

/** Sections `items` under the viewer's top N categories (their personal
 * travel-style "shape"), each section internally ordered by `options.sort`.
 * Always returns exactly `sectionCount` sections (possibly with an empty
 * `items` array) so the UI layer decides how to render an empty section
 * rather than this function silently dropping it. */
export function sectionByTopCategories<T extends SectionableItem>(
  items: T[],
  viewerVector: TravelStyleVector,
  options: SectionByTopCategoriesOptions<T>,
): FeedSection<T>[] {
  const sectionCount = options.sectionCount ?? FEED_SECTION_COUNT;
  const categoryThreshold = options.categoryThreshold ?? CATEGORY_SECTION_THRESHOLD;

  return topCategories(viewerVector, sectionCount).map((category) => ({
    category,
    items: items.filter((item) => item.categoryScores[category] >= categoryThreshold).sort(options.sort),
  }));
}
