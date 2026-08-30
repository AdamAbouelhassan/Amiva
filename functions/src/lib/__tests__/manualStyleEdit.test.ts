import { updateTravelStyleManual } from '../manualStyleEdit';
import { FakeUserStore, vector } from './fakes';

describe('updateTravelStyleManual', () => {
  it('persists the new vector as both travelStyle and travelStyleBaseline, resetting travelStyleLastUpdated', async () => {
    const store = FakeUserStore.seeded({
      alex: { travelStyle: vector({ adventure: 3 }), travelStyleBaseline: vector({ adventure: 3 }), travelStyleLastUpdated: new Date('2025-01-01') },
    });
    const now = new Date('2026-06-01');

    await updateTravelStyleManual(store, 'alex', vector({ adventure: 7, foodie: 5 }), now);

    const after = await store.getUserStyle('alex');
    expect(after.travelStyle).toEqual(vector({ adventure: 7, foodie: 5 }));
    expect(after.travelStyleBaseline).toEqual(vector({ adventure: 7, foodie: 5 }));
    expect(after.travelStyleLastUpdated).toBe(now);
  });
});
