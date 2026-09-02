/**
 * Small derived-display helpers over a TravelStyleVector.
 * functional_specification.md §2.6: "A user's matrix highlights their top
 * 3 categories (e.g., as a summary or badge treatment) on their profile."
 */
import { CATEGORY_IDS, CategoryId, TravelStyleVector } from './types';

export function topCategories(vector: TravelStyleVector, count = 3): CategoryId[] {
  return [...CATEGORY_IDS]
    .sort((a, b) => vector[b] - vector[a])
    .slice(0, count);
}
