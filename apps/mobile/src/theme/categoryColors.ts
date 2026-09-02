import { CATEGORY_IDS, CategoryId } from '@amiva/core';

/** Human-readable labels for the 19 fixed categories — Google's own
 * `label` field from packages/core/src/data/googlePlacesCategories.json,
 * copied verbatim (not shortened/reinterpreted) so this stays the single
 * place these display strings are defined (CLAUDE.md #6, DRY on
 * constants) without silently drifting from the taxonomy's own naming. */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  culture: 'Culture',
  entertainment_and_recreation: 'Entertainment and Recreation',
  food_and_drink: 'Food and Drink',
  health_and_wellness: 'Health and Wellness',
  lodging: 'Lodging',
  natural_features: 'Natural Features',
  places_of_worship: 'Places of Worship',
  shopping: 'Shopping',
  sports: 'Sports',
};

/**
 * Display order for `<TravelStyleRadar>` axes. Pre-migration this was a
 * hand-curated "clock order" deliberately decoupled from CATEGORY_IDS
 * (whose order is locked to cosine-similarity vector alignment). A
 * 19-spoke radar is a known follow-up design problem (visually cluttered;
 * several categories sit near-zero for essentially every user — see
 * TravelStyleRadar.tsx) that the taxonomy migration explicitly defers
 * rather than solves here, so there's no principled 19-item clock order
 * to curate yet either. Placeholder: same order as CATEGORY_IDS. Revisit
 * together with the radar redesign.
 */
export const RADAR_AXIS_ORDER: CategoryId[] = [...CATEGORY_IDS];

// sanity: display order must be a permutation of the canonical set
if (RADAR_AXIS_ORDER.length !== CATEGORY_IDS.length) {
  throw new Error('RADAR_AXIS_ORDER must contain every travel-style category exactly once');
}

export { categoryColor } from './themes';
