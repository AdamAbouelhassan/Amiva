import { DEFAULT_DECAY_CONFIG } from '@amiva/core';
import { applyExperienceStyleEvent } from '../travelStyleUpdate';
import { FakeUserStore, vector } from './fakes';

describe('applyExperienceStyleEvent', () => {
  it('nudges the user vector toward the experience vector and persists it', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const store = FakeUserStore.seeded({
      'user-1': {
        travelStyle: vector({ adventure: 5 }),
        travelStyleBaseline: vector({ adventure: 5 }),
        travelStyleLastUpdated: now,
      },
    });

    const result = await applyExperienceStyleEvent(store, {
      userId: 'user-1',
      experienceVector: vector({ adventure: 9 }),
      isLogged: true,
      eventDate: now,
      decayConfig: DEFAULT_DECAY_CONFIG,
    });

    expect(result.adventure).toBeGreaterThan(5);
    expect((await store.getUserStyle('user-1')).travelStyle.adventure).toBe(result.adventure);
  });

  it('never touches travelStyleBaseline or travelStyleLastUpdated (only manual edits do)', async () => {
    const baselineDate = new Date('2026-01-01T00:00:00Z');
    const store = FakeUserStore.seeded({
      'user-1': {
        travelStyle: vector({ adventure: 5 }),
        travelStyleBaseline: vector({ adventure: 5 }),
        travelStyleLastUpdated: baselineDate,
      },
    });

    await applyExperienceStyleEvent(store, {
      userId: 'user-1',
      experienceVector: vector({ adventure: 9 }),
      isLogged: false,
      eventDate: new Date('2026-02-01T00:00:00Z'),
      decayConfig: DEFAULT_DECAY_CONFIG,
    });

    const after = await store.getUserStyle('user-1');
    expect(after.travelStyleBaseline).toEqual(vector({ adventure: 5 }));
    expect(after.travelStyleLastUpdated).toBe(baselineDate);
  });
});
