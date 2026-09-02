/**
 * CATEGORY_IDS (types.ts) is hand-typed, not derived from
 * data/googlePlacesCategories.json (TypeScript can't produce a
 * string-literal union from a JSON import — see types.ts's header). This
 * test is what keeps that hand-typed array honest: any spelling drift
 * between the two gets caught here rather than silently, the actual
 * enforcement of "don't retype the ids by hand" (migration prompt).
 */
import googlePlacesCategories from '../data/googlePlacesCategories.json';
import { CATEGORY_IDS } from '../types';

describe('CATEGORY_IDS', () => {
  it('matches data/googlePlacesCategories.json\'s ids exactly, in the same order', () => {
    const jsonIds = googlePlacesCategories.categories.map((c) => c.id);
    expect([...CATEGORY_IDS]).toEqual(jsonIds);
  });

  it('has no duplicate entries', () => {
    expect(new Set(CATEGORY_IDS).size).toBe(CATEGORY_IDS.length);
  });
});
