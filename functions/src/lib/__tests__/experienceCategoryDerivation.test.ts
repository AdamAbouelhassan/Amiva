import { CATEGORY_MAX } from '@amiva/core';
import { deriveExperienceScoring } from '../experienceCategoryDerivation';
import { FakePlaceStore } from './fakes';

describe('deriveExperienceScoring', () => {
  it("derives categoryScores from the place's stored Google types", async () => {
    const placeStore = FakePlaceStore.seeded({ 'place-1': ['museum'] });
    const result = await deriveExperienceScoring(placeStore, 'place-1');
    expect(result.categoryScores.culture).toBe(CATEGORY_MAX); // museum's default-rule weight, no override
    expect(result.priceLevelAffinity).toBeUndefined(); // no priceLevel on file
  });

  it('blends multiple stored types the same way estimateCategoryScoresFromPlace does directly', async () => {
    const placeStore = FakePlaceStore.seeded({ 'place-1': ['museum', 'restaurant'] });
    const result = await deriveExperienceScoring(placeStore, 'place-1');
    expect(result.categoryScores.culture).toBeCloseTo(CATEGORY_MAX / 2);
    expect(result.categoryScores.food_and_drink).toBeCloseTo(CATEGORY_MAX / 2);
  });

  it('maps the place priceLevel to a 0–4 priceLevelAffinity', async () => {
    const placeStore = FakePlaceStore.seeded({
      'place-1': { types: ['restaurant'], priceLevel: 'PRICE_LEVEL_EXPENSIVE' },
    });
    const result = await deriveExperienceScoring(placeStore, 'place-1');
    expect(result.priceLevelAffinity).toBe(3);
  });

  it('leaves priceLevelAffinity undefined for an unspecified price level', async () => {
    const placeStore = FakePlaceStore.seeded({
      'place-1': { types: ['park'], priceLevel: 'PRICE_LEVEL_UNSPECIFIED' },
    });
    const result = await deriveExperienceScoring(placeStore, 'place-1');
    expect(result.priceLevelAffinity).toBeUndefined();
  });

  it('returns the zero vector for a place with no stored types / not on file', async () => {
    expect((await deriveExperienceScoring(FakePlaceStore.seeded({ 'p': [] }), 'p')).categoryScores.culture).toBe(0);
    expect((await deriveExperienceScoring(FakePlaceStore.seeded({}), 'nope')).categoryScores.culture).toBe(0);
  });
});
