import { coerceTravelStyleVector } from '../types';
import { CATEGORY_IDS } from '../types';
import { vector } from './testUtils';

describe('coerceTravelStyleVector', () => {
  it('passes a already-valid vector through unchanged (aside from clamping)', () => {
    const input = vector({ culture: 7, food_and_drink: 3 });
    expect(coerceTravelStyleVector(input)).toEqual(input);
  });

  it('fills in every category, defaulting anything missing to 0', () => {
    const result = coerceTravelStyleVector({ culture: 7 });
    expect(result.culture).toBe(7);
    for (const category of CATEGORY_IDS) {
      if (category !== 'culture') expect(result[category]).toBe(0);
    }
  });

  it('drops old pre-migration (8-category) keys entirely rather than crashing', () => {
    // A real pre-taxonomy-migration (2026-09-02) travelStyle document shape.
    const oldShaped = {
      adventure: 7,
      luxury: 8,
      culture: 9,
      foodie: 7,
      relaxation: 7,
      socialNightlife: 5,
      nature: 9,
      budgetBackpacker: 3,
    };
    const result = coerceTravelStyleVector(oldShaped);
    // "culture" coincidentally survives as a real new-taxonomy key too.
    expect(result.culture).toBe(9);
    // None of the other old keys exist in CategoryId, so they all drop —
    // every new-taxonomy category reads as 0.
    for (const category of CATEGORY_IDS) {
      if (category !== 'culture') expect(result[category]).toBe(0);
    }
  });

  it('coerces undefined, null, and non-object input to the zero vector rather than throwing', () => {
    for (const bad of [undefined, null, 'not an object', 42, []] as unknown[]) {
      const result = coerceTravelStyleVector(bad);
      for (const category of CATEGORY_IDS) {
        expect(result[category]).toBe(0);
      }
    }
  });

  it('ignores a non-numeric value at a real category key instead of propagating NaN', () => {
    const result = coerceTravelStyleVector({ culture: 'not a number', food_and_drink: 5 });
    expect(result.culture).toBe(0);
    expect(result.food_and_drink).toBe(5);
  });

  it('clamps an out-of-range numeric value the same way clampCategoryValue does', () => {
    const result = coerceTravelStyleVector({ culture: 999, food_and_drink: -5 });
    expect(result.culture).toBe(10);
    expect(result.food_and_drink).toBe(0);
  });

  it('never throws — the whole point is a screen render / decay computation can trust the result', () => {
    expect(() => coerceTravelStyleVector(undefined)).not.toThrow();
    expect(() => coerceTravelStyleVector({})).not.toThrow();
  });
});
