import { deriveExperienceCategoryScores } from '../experienceCategoryDerivation';
import { FakePlaceStore } from './fakes';

describe('deriveExperienceCategoryScores', () => {
  it("derives categoryScores from the place's stored Google types", async () => {
    const placeStore = FakePlaceStore.seeded({ 'place-1': ['museum'] });
    const result = await deriveExperienceCategoryScores(placeStore, 'place-1');
    expect(result.culture).toBe(10); // museum's default-rule weight, no override entry
  });

  it('blends multiple stored types the same way estimateCategoryScoresFromPlace does directly', async () => {
    const placeStore = FakePlaceStore.seeded({ 'place-1': ['museum', 'restaurant'] });
    const result = await deriveExperienceCategoryScores(placeStore, 'place-1');
    expect(result.culture).toBeCloseTo(5);
    expect(result.food_and_drink).toBeCloseTo(5);
  });

  it('returns the zero vector for a place with no stored types', async () => {
    const placeStore = FakePlaceStore.seeded({ 'place-1': [] });
    const result = await deriveExperienceCategoryScores(placeStore, 'place-1');
    expect(result.culture).toBe(0);
  });

  it('returns the zero vector for a place that does not exist on file', async () => {
    const placeStore = FakePlaceStore.seeded({});
    const result = await deriveExperienceCategoryScores(placeStore, 'unknown-place');
    expect(result.culture).toBe(0);
  });
});
