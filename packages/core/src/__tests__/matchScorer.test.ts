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
  it('scores two identical category vectors as a perfect match', () => {
    const scorer = new CosineSimilarityMatchScorer();
    const a = vector({ entertainment_and_recreation: 8, food_and_drink: 6, culture: 4 });
    expect(scorer.score(a, a)).toBeCloseTo(1);
  });

  it('scores a high-lodging vector poorly against a high-transportation vector', () => {
    const scorer = new CosineSimilarityMatchScorer();
    const lodgingTraveler = vector({ lodging: 10, health_and_wellness: 8 });
    const backpacker = vector({ transportation: 10, entertainment_and_recreation: 8 });
    const score = scorer.score(lodgingTraveler, backpacker);
    expect(score).toBeLessThan(0.3);
  });

  it('rewards composite experiences that overlap on multiple axes (e.g. a food tour at a nice hotel)', () => {
    const scorer = new CosineSimilarityMatchScorer();
    const foodieLodgingUser = vector({ lodging: 8, food_and_drink: 8 });
    const foodTourExperience = vector({ lodging: 9, food_and_drink: 9 });
    expect(scorer.score(foodieLodgingUser, foodTourExperience)).toBeGreaterThan(0.95);
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
