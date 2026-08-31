import { TRAVEL_STYLE_CATEGORIES, TravelStyleCategory } from '@amiva/core';

/** Human-readable labels for the 8 fixed categories — the only place
 * these display strings are defined (CLAUDE.md #6, DRY on constants). */
export const CATEGORY_LABELS: Record<TravelStyleCategory, string> = {
  adventure: 'Adventure',
  luxury: 'Luxury',
  culture: 'Culture',
  foodie: 'Foodie',
  relaxation: 'Relaxation',
  socialNightlife: 'Social',
  nature: 'Nature',
  budgetBackpacker: 'Backpacker',
};

/**
 * Clock order for `<TravelStyleRadar>` axes (brief §2): Adventure at 12,
 * then clockwise. This is a *display* order only — it is deliberately
 * decoupled from `TRAVEL_STYLE_CATEGORIES` (whose order is locked to
 * cosine-similarity vector alignment and must never change). Every radar
 * everywhere uses this order so a user's "shape" is visually comparable.
 */
export const RADAR_AXIS_ORDER: TravelStyleCategory[] = [
  'adventure',
  'culture',
  'foodie',
  'socialNightlife',
  'budgetBackpacker',
  'relaxation',
  'nature',
  'luxury',
];

// sanity: display order must be a permutation of the canonical set
if (RADAR_AXIS_ORDER.length !== TRAVEL_STYLE_CATEGORIES.length) {
  throw new Error('RADAR_AXIS_ORDER must contain every travel-style category exactly once');
}

export { categoryColor } from './themes';
