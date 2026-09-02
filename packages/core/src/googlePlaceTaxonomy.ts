/**
 * Typed accessors over Google's own place-type taxonomy
 * (data/googlePlacesCategories.json, data/googlePlacesTypes.json — see
 * that directory's origin note in types.ts's header).
 *
 * `PlaceTypeId` is intentionally just `string`, not a 477-member literal
 * union: Google adds new types over time (the data file's own `note` says
 * so), and a place fetched from a live Places API call can carry a type
 * this snapshot doesn't know about yet. The accessors below degrade
 * gracefully (return `undefined`) for an unrecognized type rather than
 * requiring this file to be edited every time Google's taxonomy grows —
 * see placeCategoryEstimate.ts for how the caller uses that.
 */
import categoriesData from './data/googlePlacesCategories.json';
import typesData from './data/googlePlacesTypes.json';
import { CategoryId } from './types';

export type PlaceTypeId = string;

interface GooglePlaceTypeEntry {
  type: string;
  category: string;
  label: string;
}

interface GooglePlaceCategoryEntry {
  id: string;
  label: string;
}

const TYPE_ENTRIES = (typesData as { types: GooglePlaceTypeEntry[] }).types;
const CATEGORY_ENTRIES = (categoriesData as { categories: GooglePlaceCategoryEntry[] }).categories;

const TYPE_TO_CATEGORY: ReadonlyMap<string, CategoryId> = new Map(
  TYPE_ENTRIES.map((entry) => [entry.type, entry.category as CategoryId]),
);

const TYPE_TO_LABEL: ReadonlyMap<string, string> = new Map(TYPE_ENTRIES.map((entry) => [entry.type, entry.label]));

/** Google's own top-level category for a place type, per Table A — the
 * "default rule" input for placeCategoryEstimate.ts's weight table.
 * Returns undefined for a type this snapshot doesn't recognize (a newly
 * added Google type, or a typo) rather than throwing. */
export function getCategoryForType(type: PlaceTypeId): CategoryId | undefined {
  return TYPE_TO_CATEGORY.get(type);
}

/** Human-readable label for a place type, e.g. `museum` -> "Museum". */
export function getLabelForType(type: PlaceTypeId): string | undefined {
  return TYPE_TO_LABEL.get(type);
}

export function isKnownPlaceType(type: PlaceTypeId): boolean {
  return TYPE_TO_CATEGORY.has(type);
}

export const GOOGLE_PLACE_TYPE_COUNT = TYPE_ENTRIES.length;
export const GOOGLE_PLACE_CATEGORY_COUNT = CATEGORY_ENTRIES.length;
