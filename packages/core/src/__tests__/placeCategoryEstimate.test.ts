import { CATEGORY_SEARCH_HINTS, estimateCategoryScoresFromPlace, GOOGLE_PLACE_TYPE_WEIGHTS } from '../placeCategoryEstimate';
import { CATEGORY_MAX, CATEGORY_MIN, TRAVEL_STYLE_CATEGORIES } from '../types';

describe('estimateCategoryScoresFromPlace', () => {
  it('returns the zero vector when no type is recognized', () => {
    const result = estimateCategoryScoresFromPlace(['point_of_interest', 'establishment']);
    for (const category of TRAVEL_STYLE_CATEGORIES) {
      expect(result[category]).toBe(0);
    }
  });

  it('scores a single-type place from that type\'s weight table entry', () => {
    const result = estimateCategoryScoresFromPlace(['museum']);
    expect(result.culture).toBe(GOOGLE_PLACE_TYPE_WEIGHTS.museum!.culture);
    expect(result.adventure).toBe(0);
  });

  it('averages weights across multiple recognized types on the same place', () => {
    // night_club: socialNightlife 9, luxury 3. bar: socialNightlife 8, foodie 2.
    const result = estimateCategoryScoresFromPlace(['night_club', 'bar']);
    expect(result.socialNightlife).toBeCloseTo((9 + 8) / 2);
    expect(result.luxury).toBeCloseTo(3 / 2);
    expect(result.foodie).toBeCloseTo(2 / 2);
  });

  it('ignores unrecognized types instead of diluting the average toward zero', () => {
    const withNoise = estimateCategoryScoresFromPlace(['museum', 'point_of_interest', 'establishment']);
    const withoutNoise = estimateCategoryScoresFromPlace(['museum']);
    expect(withNoise).toEqual(withoutNoise);
  });

  it('nudges luxury up for a high price level', () => {
    const cheap = estimateCategoryScoresFromPlace(['restaurant'], 0);
    const pricey = estimateCategoryScoresFromPlace(['restaurant'], 4);
    expect(pricey.luxury).toBeGreaterThan(cheap.luxury);
  });

  it('nudges budgetBackpacker up for a low price level', () => {
    const cheap = estimateCategoryScoresFromPlace(['restaurant'], 0);
    const pricey = estimateCategoryScoresFromPlace(['restaurant'], 4);
    expect(cheap.budgetBackpacker).toBeGreaterThan(pricey.budgetBackpacker);
  });

  it('always returns a vector clamped within [CATEGORY_MIN, CATEGORY_MAX]', () => {
    // hiking_area + national_park + ski_resort all weight adventure/nature
    // heavily, plus a max price-level nudge, to try to push past 10.
    const result = estimateCategoryScoresFromPlace(['hiking_area', 'national_park', 'ski_resort'], 4);
    for (const category of TRAVEL_STYLE_CATEGORIES) {
      expect(result[category]).toBeGreaterThanOrEqual(CATEGORY_MIN);
      expect(result[category]).toBeLessThanOrEqual(CATEGORY_MAX);
    }
  });
});

describe('CATEGORY_SEARCH_HINTS', () => {
  it('has an entry for every travel style category', () => {
    for (const category of TRAVEL_STYLE_CATEGORIES) {
      expect(CATEGORY_SEARCH_HINTS[category]).toBeDefined();
      expect(CATEGORY_SEARCH_HINTS[category].googleType.length).toBeGreaterThan(0);
      expect(CATEGORY_SEARCH_HINTS[category].keyword.length).toBeGreaterThan(0);
    }
  });
});
