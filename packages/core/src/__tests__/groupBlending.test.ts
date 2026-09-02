import { averageVectors, computeGroupRecommendation, variance } from '../groupBlending';
import { vector } from './testUtils';

describe('variance', () => {
  it('is 0 for identical values', () => {
    expect(variance([0.5, 0.5, 0.5])).toBe(0);
  });
  it('is 0 for an empty array', () => {
    expect(variance([])).toBe(0);
  });
  it('computes population variance', () => {
    expect(variance([1, 2, 3, 4])).toBeCloseTo(1.25);
  });
});

describe('averageVectors', () => {
  it('averages per category across collaborators', () => {
    const result = averageVectors([
      vector({ entertainment_and_recreation: 10, food_and_drink: 0 }),
      vector({ entertainment_and_recreation: 0, food_and_drink: 10 }),
    ]);
    expect(result.entertainment_and_recreation).toBe(5);
    expect(result.food_and_drink).toBe(5);
  });
  it('throws on an empty list', () => {
    expect(() => averageVectors([])).toThrow();
  });
});

describe('computeGroupRecommendation', () => {
  it('returns a blended recommendation when the group is aligned (low variance)', () => {
    const candidate = vector({ culture: 9, food_and_drink: 8 });
    const collaborators = [
      { collaboratorId: 'alex', travelStyle: vector({ culture: 8, food_and_drink: 7 }) },
      { collaboratorId: 'sam', travelStyle: vector({ culture: 9, food_and_drink: 8 }) },
    ];

    const result = computeGroupRecommendation(collaborators, candidate, { varianceThreshold: 0.05 });

    expect(result.type).toBe('blended');
  });

  it('returns segmented per-collaborator recommendations when the group diverges (high variance)', () => {
    const candidate = vector({ lodging: 10, health_and_wellness: 9 });
    const collaborators = [
      { collaboratorId: 'alex', travelStyle: vector({ lodging: 10, health_and_wellness: 9 }) }, // near-perfect match
      { collaboratorId: 'sam', travelStyle: vector({ transportation: 10, entertainment_and_recreation: 9 }) }, // poor match
    ];

    const result = computeGroupRecommendation(collaborators, candidate, { varianceThreshold: 0.02 });

    expect(result.type).toBe('segmented');
    if (result.type === 'segmented') {
      expect(result.perCollaborator).toHaveLength(2);
      const alex = result.perCollaborator.find((p) => p.collaboratorId === 'alex')!;
      const sam = result.perCollaborator.find((p) => p.collaboratorId === 'sam')!;
      expect(alex.matchScore).toBeGreaterThan(sam.matchScore);
    }
  });

  it('does not force a single flattened compromise when variance is high — segmented result carries no groupVector', () => {
    const candidate = vector({ lodging: 10 });
    const collaborators = [
      { collaboratorId: 'a', travelStyle: vector({ lodging: 10 }) },
      { collaboratorId: 'b', travelStyle: vector({ transportation: 10 }) },
    ];
    const result = computeGroupRecommendation(collaborators, candidate, { varianceThreshold: 0.01 });
    expect(result.type).toBe('segmented');
    expect((result as any).groupVector).toBeUndefined();
  });

  it('throws with no collaborators', () => {
    expect(() => computeGroupRecommendation([], vector(), {})).toThrow();
  });
});
