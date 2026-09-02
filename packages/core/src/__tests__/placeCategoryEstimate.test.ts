import { CATEGORY_WEIGHT_OVERRIDES, CATEGORY_SEARCH_HINTS, estimateCategoryScoresFromPlace } from '../placeCategoryEstimate';
import { getCategoryForType, isKnownPlaceType } from '../googlePlaceTaxonomy';
import googlePlacesTypes from '../data/googlePlacesTypes.json';
import { CATEGORY_IDS, CATEGORY_MAX, CATEGORY_MIN } from '../types';

const ALL_TYPES = googlePlacesTypes.types.map((t) => t.type);

describe('estimateCategoryScoresFromPlace', () => {
  it('returns the zero vector for a completely unrecognized type', () => {
    const result = estimateCategoryScoresFromPlace(['not_a_real_google_type']);
    for (const category of CATEGORY_IDS) {
      expect(result[category]).toBe(0);
    }
  });

  it('default rule: an unlisted type scores full weight on its own Table A category', () => {
    // "university" is in education, has no override entry.
    expect(CATEGORY_WEIGHT_OVERRIDES.university).toBeUndefined();
    const result = estimateCategoryScoresFromPlace(['university']);
    expect(result.education).toBe(10);
    expect(result.culture).toBe(0);
  });

  it('override rule: a listed type uses its curated split instead of the default', () => {
    const result = estimateCategoryScoresFromPlace(['historical_landmark']);
    expect(result.entertainment_and_recreation).toBe(CATEGORY_WEIGHT_OVERRIDES.historical_landmark!.entertainment_and_recreation);
    expect(result.culture).toBe(CATEGORY_WEIGHT_OVERRIDES.historical_landmark!.culture);
  });

  it('averages weights across multiple recognized types on the same place', () => {
    // museum (default: culture=10) + university (default: education=10)
    const result = estimateCategoryScoresFromPlace(['museum', 'university']);
    expect(result.culture).toBeCloseTo(5);
    expect(result.education).toBeCloseTo(5);
  });

  it('ignores unrecognized types instead of diluting the average toward zero', () => {
    const withNoise = estimateCategoryScoresFromPlace(['museum', 'point_of_interest', 'establishment']);
    const withoutNoise = estimateCategoryScoresFromPlace(['museum']);
    expect(withNoise).toEqual(withoutNoise);
  });

  it('always returns a vector clamped within [CATEGORY_MIN, CATEGORY_MAX]', () => {
    const result = estimateCategoryScoresFromPlace(['museum', 'university', 'restaurant', 'spa']);
    for (const category of CATEGORY_IDS) {
      expect(result[category]).toBeGreaterThanOrEqual(CATEGORY_MIN);
      expect(result[category]).toBeLessThanOrEqual(CATEGORY_MAX);
    }
  });
});

describe('CATEGORY_WEIGHT_OVERRIDES', () => {
  it('every override key is a real, known Google place type', () => {
    for (const type of Object.keys(CATEGORY_WEIGHT_OVERRIDES)) {
      expect(isKnownPlaceType(type)).toBe(true);
    }
  });

  it('every override value uses only real CategoryId keys', () => {
    for (const weights of Object.values(CATEGORY_WEIGHT_OVERRIDES)) {
      for (const category of Object.keys(weights ?? {})) {
        expect(CATEGORY_IDS).toContain(category);
      }
    }
  });

  it('every override weight is non-negative', () => {
    for (const weights of Object.values(CATEGORY_WEIGHT_OVERRIDES)) {
      for (const weight of Object.values(weights ?? {})) {
        expect(weight).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('googlePlaceTaxonomy', () => {
  it('resolves every one of the ~477 known types to a real CategoryId', () => {
    for (const type of ALL_TYPES) {
      const category = getCategoryForType(type);
      expect(category).toBeDefined();
      expect(CATEGORY_IDS).toContain(category);
    }
  });

  it('falls back gracefully (undefined, not a throw) for a type it does not recognize', () => {
    expect(getCategoryForType('some_brand_new_google_type_from_the_future')).toBeUndefined();
    expect(isKnownPlaceType('some_brand_new_google_type_from_the_future')).toBe(false);
  });
});

describe('CATEGORY_SEARCH_HINTS', () => {
  it('has an entry for every category, each with a non-empty googleType and keyword', () => {
    for (const category of CATEGORY_IDS) {
      expect(CATEGORY_SEARCH_HINTS[category]).toBeDefined();
      expect(CATEGORY_SEARCH_HINTS[category].googleType.length).toBeGreaterThan(0);
      expect(CATEGORY_SEARCH_HINTS[category].keyword.length).toBeGreaterThan(0);
    }
  });

  it("every hint's googleType is itself a real, known Google place type", () => {
    for (const category of CATEGORY_IDS) {
      expect(isKnownPlaceType(CATEGORY_SEARCH_HINTS[category].googleType)).toBe(true);
    }
  });
});
