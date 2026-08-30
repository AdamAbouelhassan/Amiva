import { computeMatchScore } from '../computeMatchScore';
import { FakeExperienceStore, FakeUserStore, vector } from './fakes';

describe('computeMatchScore', () => {
  const userStore = FakeUserStore.seeded({
    alex: { travelStyle: vector({ foodie: 8, culture: 6 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
    sam: { travelStyle: vector({ foodie: 8, culture: 6 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
  });
  const experienceStore = FakeExperienceStore.seeded({
    'exp-1': {
      experienceId: 'exp-1',
      ownerId: 'sam',
      placeId: 'place-1',
      categoryScores: vector({ foodie: 9, culture: 5 }),
      photoUrls: [],
      date: new Date(),
      rating: 5,
    },
  });
  const stores = { userStore, experienceStore };

  it('scores user vs. raw vector', async () => {
    const result = await computeMatchScore({ type: 'user', userId: 'alex' }, { type: 'vector', vector: vector({ foodie: 8, culture: 6 }) }, stores);
    expect(result.matchPercent).toBe(100);
  });

  it('scores user vs. experience', async () => {
    const result = await computeMatchScore({ type: 'user', userId: 'alex' }, { type: 'experience', experienceId: 'exp-1' }, stores);
    expect(result.similarity).toBeGreaterThan(0.9);
    expect(result.matchPercent).toBe(Math.round(result.similarity * 100));
  });

  it('scores user vs. user (compatibility)', async () => {
    const result = await computeMatchScore({ type: 'user', userId: 'alex' }, { type: 'user', userId: 'sam' }, stores);
    expect(result.matchPercent).toBe(100);
  });
});
