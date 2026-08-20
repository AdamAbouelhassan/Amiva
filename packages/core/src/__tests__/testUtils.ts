import { TravelStyleVector, zeroTravelStyleVector } from '../types';

/** Builds a full TravelStyleVector from partial overrides, defaulting
 * unspecified categories to 0. Keeps test cases focused on the categories
 * that matter for each assertion. */
export function vector(overrides: Partial<TravelStyleVector> = {}): TravelStyleVector {
  return { ...zeroTravelStyleVector(), ...overrides };
}
