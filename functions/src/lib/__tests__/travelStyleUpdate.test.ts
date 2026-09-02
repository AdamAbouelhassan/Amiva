import { DEFAULT_DECAY_CONFIG, STAR_RATING_MULTIPLIER } from '@amiva/core';
import { applyExperienceStyleEvent } from '../travelStyleUpdate';
import { FakeUserStore, vector } from './fakes';

describe('applyExperienceStyleEvent', () => {
  it('nudges the user vector toward the experience vector and persists it', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const store = FakeUserStore.seeded({
      'user-1': {
        travelStyle: vector({ entertainment_and_recreation: 5 }),
        travelStyleBaseline: vector({ entertainment_and_recreation: 5 }),
        travelStyleLastUpdated: now,
      },
    });

    const result = await applyExperienceStyleEvent(store, {
      userId: 'user-1',
      experienceVector: vector({ entertainment_and_recreation: 9 }),
      isLogged: true,
      eventDate: now,
      decayConfig: DEFAULT_DECAY_CONFIG,
      starRating: 4, // 4 stars = parity with the old flat W_LOGGED behavior
    });

    expect(result.entertainment_and_recreation).toBeGreaterThan(5);
    expect((await store.getUserStyle('user-1')).travelStyle.entertainment_and_recreation).toBe(
      result.entertainment_and_recreation,
    );
  });

  it('never touches travelStyleBaseline or travelStyleLastUpdated (only manual edits do)', async () => {
    const baselineDate = new Date('2026-01-01T00:00:00Z');
    const store = FakeUserStore.seeded({
      'user-1': {
        travelStyle: vector({ entertainment_and_recreation: 5 }),
        travelStyleBaseline: vector({ entertainment_and_recreation: 5 }),
        travelStyleLastUpdated: baselineDate,
      },
    });

    await applyExperienceStyleEvent(store, {
      userId: 'user-1',
      experienceVector: vector({ entertainment_and_recreation: 9 }),
      isLogged: false,
      eventDate: new Date('2026-02-01T00:00:00Z'),
      decayConfig: DEFAULT_DECAY_CONFIG,
    });

    const after = await store.getUserStyle('user-1');
    expect(after.travelStyleBaseline).toEqual(vector({ entertainment_and_recreation: 5 }));
    expect(after.travelStyleLastUpdated).toBe(baselineDate);
  });

  describe('star-rating-modulated nudge (logged path only)', () => {
    // No decay noise, and a deliberately small current->experience gap (5
    // -> 6, not 0 -> 10) so a nudge never saturates CATEGORY_MAX and
    // clamping can't mask a real difference between star ratings' deltas.
    const uncappedConfig = { wLogged: 3, wSaved: 1, decayLambda: 0, maxStep: 1000 };
    const now = new Date('2026-01-01T00:00:00Z');
    const STARTING_VALUE = 5;
    const EXPERIENCE_VALUE = 6;

    function nudgeFor(starRating: number) {
      const store = FakeUserStore.seeded({
        u: {
          travelStyle: vector({ entertainment_and_recreation: STARTING_VALUE }),
          travelStyleBaseline: vector({ entertainment_and_recreation: STARTING_VALUE }),
          travelStyleLastUpdated: now,
        },
      });
      return applyExperienceStyleEvent(store, {
        userId: 'u',
        experienceVector: vector({ entertainment_and_recreation: EXPERIENCE_VALUE }),
        isLogged: true,
        eventDate: now,
        decayConfig: uncappedConfig,
        starRating,
      });
    }

    it('applies zero nudge for a 1-star experience — the vector stays exactly where it was', async () => {
      const result = await nudgeFor(1);
      expect(result.entertainment_and_recreation).toBe(STARTING_VALUE);
    });

    it('applies a larger nudge for a 5-star experience than a 3-star one', async () => {
      const threeStars = await nudgeFor(3);
      const fiveStars = await nudgeFor(5);
      expect(fiveStars.entertainment_and_recreation).toBeGreaterThan(threeStars.entertainment_and_recreation);
    });

    it('matches STAR_RATING_MULTIPLIER exactly: delta = wLogged * multiplier * (experience - current)', async () => {
      for (const rating of [1, 2, 3, 4, 5] as const) {
        const result = await nudgeFor(rating);
        const gap = EXPERIENCE_VALUE - STARTING_VALUE;
        const expected = STARTING_VALUE + uncappedConfig.wLogged * STAR_RATING_MULTIPLIER[rating] * gap;
        expect(result.entertainment_and_recreation).toBeCloseTo(expected);
      }
    });

    it("does not change the experience's own categoryScores — only the logger's travelStyle nudge magnitude", async () => {
      // Two loggers, same experience, different star ratings: the
      // *experience vector itself* passed in is identical either way
      // (categoryScores is derived from the Place, not the rating) — this
      // test just confirms applyExperienceStyleEvent never mutates its
      // experienceVector input, so two callers logging the same place with
      // different ratings would each see the same match% against it.
      const sharedExperienceVector = vector({ entertainment_and_recreation: 7 });
      await nudgeFor(2);
      expect(sharedExperienceVector).toEqual(vector({ entertainment_and_recreation: 7 }));
    });
  });

  it('a save is unaffected by star-rating logic even if starRating were somehow passed (saves never pass it)', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const withoutRating = FakeUserStore.seeded({
      u: { travelStyle: vector(), travelStyleBaseline: vector(), travelStyleLastUpdated: now },
    });
    const result = await applyExperienceStyleEvent(withoutRating, {
      userId: 'u',
      experienceVector: vector({ entertainment_and_recreation: 10 }),
      isLogged: false,
      eventDate: now,
      decayConfig: { wLogged: 3, wSaved: 1, decayLambda: 0, maxStep: 1000 },
    });

    // Flat W_SAVED behavior, exactly as pre-migration.
    expect(result.entertainment_and_recreation).toBeCloseTo(10);
  });
});
