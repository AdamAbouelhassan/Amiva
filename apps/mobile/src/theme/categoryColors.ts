import { TravelStyleCategory } from '@amiva/core';

/** Human-readable labels for the 8 fixed categories — the only place
 * these display strings are defined (CLAUDE.md #6, DRY on constants). */
export const CATEGORY_LABELS: Record<TravelStyleCategory, string> = {
  adventure: 'Adventure',
  luxury: 'Luxury',
  culture: 'Culture',
  foodie: 'Foodie',
  relaxation: 'Relaxation',
  socialNightlife: 'Social/Nightlife',
  nature: 'Nature',
  budgetBackpacker: 'Budget/Backpacker',
};
