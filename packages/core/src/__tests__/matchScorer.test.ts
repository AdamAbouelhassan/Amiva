import { cosineSimilarity, CosineSimilarityMatchScorer, toMatchPercent } from '../matchScorer';
import { vector } from './testUtils';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns 0 (not NaN) when either vector is all zero', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it('is symmetric', () => {
    const a = [1, 4, 2, 8];
    const b = [3, 1, 9, 2];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
  });

  it('throws on mismatched lengths', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
  });
});

describe('CosineSimilarityMatchScorer (Strategy implementation)', () => {
  it('scores two identical 8-category vectors as a perfect match', () => {
    const scorer = new CosineSimilarityMatchScorer();
    const a = vector({ adventure: 8, foodie: 6, culture: 4 });
    expect(scorer.score(a, a)).toBeCloseTo(1);
  });

  it('scores a high-luxury vector poorly against a high-budget-backpacker vector', () => {
    const scorer = new CosineSimilarityMatchScorer();
    const luxuryTraveler = vector({ luxury: 10, relaxation: 8 });
    const backpacker = vector({ budgetBackpacker: 10, adventure: 8 });
    const score = scorer.score(luxuryTraveler, backpacker);
    expect(score).toBeLessThan(0.3);
  });

  it('rewards composite experiences that overlap on multiple axes (e.g. luxury food tour)', () => {
    const scorer = new CosineSimilarityMatchScorer();
    const foodieLuxuryUser = vector({ luxury: 8, foodie: 8 });
    const luxuryFoodTourExperience = vector({ luxury: 9, foodie: 9 });
    expect(scorer.score(foodieLuxuryUser, luxuryFoodTourExperience)).toBeGreaterThan(0.95);
  });
});

describe('toMatchPercent', () => {
  it('rounds similarity to the nearest whole percent', () => {
    expect(toMatchPercent(0.876)).toBe(88);
    expect(toMatchPercent(1)).toBe(100);
    expect(toMatchPercent(0)).toBe(0);
    expect(toMatchPercent(0.004)).toBe(0);
  });
});
