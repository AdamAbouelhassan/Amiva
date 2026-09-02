import { updateTravelStyleManual } from '../manualStyleEdit';
import { FakeUserStore, vector } from './fakes';

describe('updateTravelStyleManual', () => {
  it('persists the new vector as both travelStyle and travelStyleBaseline, resetting travelStyleLastUpdated', async () => {
    const store = FakeUserStore.seeded({
      alex: { travelStyle: vector({ entertainment_and_recreation: 3 }), travelStyleBaseline: vector({ entertainment_and_recreation: 3 }), travelStyleLastUpdated: new Date('2025-01-01') },
    });
    const now = new Date('2026-06-01');

    await updateTravelStyleManual(store, 'alex', vector({ entertainment_and_recreation: 4, food_and_drink: 3 }), now);

    const after = await store.getUserStyle('alex');
    expect(after.travelStyle).toEqual(vector({ entertainment_and_recreation: 4, food_and_drink: 3 }));
    expect(after.travelStyleBaseline).toEqual(vector({ entertainment_and_recreation: 4, food_and_drink: 3 }));
    expect(after.travelStyleLastUpdated).toBe(now);
  });
});
