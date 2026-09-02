import { DecayConfig } from '../constants';
import { applyManualStyleEdit, computeStyleAdjustment } from '../travelStyleDecay';
import { CATEGORY_IDS } from '../types';
import { vector } from './testUtils';

// A config with no cap and no decay, isolating the weight/decay math being
// tested from the clamping behavior (tested separately below).
const UNCAPPED_CONFIG: DecayConfig = {
  wLogged: 3,
  wSaved: 1,
  decayLambda: 0.05,
  maxStep: 1000,
};

describe('computeStyleAdjustment — weighting: logged vs. saved', () => {
  it('applies exactly 3x the delta magnitude for a logged event vs. a saved event, all else equal', () => {
    const currentVector = vector({ entertainment_and_recreation: 5 });
    const experienceVector = vector({ entertainment_and_recreation: 9 });
    const eventDate = new Date('2026-01-01T00:00:00Z');
    const travelStyleLastUpdated = eventDate; // daysSinceBaseline = 0 -> decayFactor = 1

    const loggedResult = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated,
      experienceVector,
      isLogged: true,
      eventDate,
      config: UNCAPPED_CONFIG,
    });
    const savedResult = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated,
      experienceVector,
      isLogged: false,
      eventDate,
      config: UNCAPPED_CONFIG,
    });

    expect(loggedResult.delta.entertainment_and_recreation).toBeCloseTo(savedResult.delta.entertainment_and_recreation * 3);
  });
});

describe('computeStyleAdjustment — recency decay', () => {
  it('produces a smaller delta the further the event is from the last baseline reset', () => {
    const currentVector = vector({ entertainment_and_recreation: 5 });
    const experienceVector = vector({ entertainment_and_recreation: 9 });
    const travelStyleLastUpdated = new Date('2026-01-01T00:00:00Z');

    const recentEvent = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated,
      experienceVector,
      isLogged: true,
      eventDate: new Date('2026-01-02T00:00:00Z'), // 1 day since baseline
      config: UNCAPPED_CONFIG,
    });
    const distantEvent = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated,
      experienceVector,
      isLogged: true,
      eventDate: new Date('2026-03-01T00:00:00Z'), // ~59 days since baseline
      config: UNCAPPED_CONFIG,
    });

    expect(Math.abs(distantEvent.delta.entertainment_and_recreation)).toBeLessThan(
      Math.abs(recentEvent.delta.entertainment_and_recreation),
    );
    expect(Math.abs(distantEvent.delta.entertainment_and_recreation)).toBeGreaterThan(0);
  });

  it('applies full weight (decayFactor = 1) when the event is exactly at the baseline date', () => {
    const currentVector = vector({ entertainment_and_recreation: 5 });
    const experienceVector = vector({ entertainment_and_recreation: 9 });
    const now = new Date('2026-01-01T00:00:00Z');

    const result = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated: now,
      experienceVector,
      isLogged: false,
      eventDate: now,
      config: UNCAPPED_CONFIG,
    });

    // weight(saved)=1, decayFactor=1 -> delta = (9-5)*1*1 = 4
    expect(result.delta.entertainment_and_recreation).toBeCloseTo(4);
  });
});

describe('computeStyleAdjustment — per-step cap', () => {
  it('clamps a large raw delta to +/- MAX_STEP', () => {
    const cappedConfig: DecayConfig = { wLogged: 3, wSaved: 1, decayLambda: 0, maxStep: 0.5 };
    const currentVector = vector({ entertainment_and_recreation: 0 });
    const experienceVector = vector({ entertainment_and_recreation: 10 }); // huge raw gap
    const now = new Date('2026-01-01T00:00:00Z');

    const result = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated: now,
      experienceVector,
      isLogged: true, // weight 3, decayFactor 1 -> raw delta = 30, way over cap
      eventDate: now,
      config: cappedConfig,
    });

    expect(result.delta.entertainment_and_recreation).toBe(0.5);
    expect(result.travelStyle.entertainment_and_recreation).toBe(0.5);
  });

  it('clamps a large negative raw delta to -MAX_STEP', () => {
    const cappedConfig: DecayConfig = { wLogged: 3, wSaved: 1, decayLambda: 0, maxStep: 0.5 };
    const currentVector = vector({ entertainment_and_recreation: 5 });
    const experienceVector = vector({ entertainment_and_recreation: 0 });
    const now = new Date('2026-01-01T00:00:00Z');

    const result = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated: now,
      experienceVector,
      isLogged: true,
      eventDate: now,
      config: cappedConfig,
    });

    expect(result.delta.entertainment_and_recreation).toBe(-0.5);
    expect(result.travelStyle.entertainment_and_recreation).toBe(4.5);
  });

  it('never causes a single event to swing a category by more than MAX_STEP even across every category', () => {
    const cappedConfig: DecayConfig = { wLogged: 3, wSaved: 1, decayLambda: 0, maxStep: 0.5 };
    const currentVector = vector();
    const experienceVector = vector(
      Object.fromEntries(CATEGORY_IDS.map((c) => [c, 10])) as Partial<
        Record<(typeof CATEGORY_IDS)[number], number>
      >,
    );
    const now = new Date('2026-01-01T00:00:00Z');

    const result = computeStyleAdjustment({
      currentVector,
      travelStyleLastUpdated: now,
      experienceVector,
      isLogged: true,
      eventDate: now,
      config: cappedConfig,
    });

    for (const value of Object.values(result.delta)) {
      expect(Math.abs(value)).toBeLessThanOrEqual(0.5);
    }
  });
});

describe('applyManualStyleEdit — baseline reset', () => {
  it('sets travelStyle and travelStyleBaseline to the manually-entered vector, and resets travelStyleLastUpdated', () => {
    const manualVector = vector({ entertainment_and_recreation: 4, food_and_drink: 3 });
    const now = new Date('2026-06-01T00:00:00Z');

    const result = applyManualStyleEdit(manualVector, now);

    expect(result.travelStyle).toEqual(manualVector);
    expect(result.travelStyleBaseline).toEqual(manualVector);
    expect(result.travelStyleLastUpdated).toBe(now);
  });

  it('causes the next automatic adjustment to decay from the new baseline date, not any prior activity', () => {
    const manualVector = vector({ entertainment_and_recreation: 3 });
    const manualEditDate = new Date('2026-06-01T00:00:00Z');
    const { travelStyle, travelStyleLastUpdated } = applyManualStyleEdit(
      manualVector,
      manualEditDate,
    );

    // An automatic event one day after the manual edit should decay as if
    // "day 1 since baseline", regardless of how old the user's account or
    // prior automatic activity was.
    const eventDate = new Date('2026-06-02T00:00:00Z');
    const result = computeStyleAdjustment({
      currentVector: travelStyle,
      travelStyleLastUpdated,
      experienceVector: vector({ entertainment_and_recreation: 9 }),
      isLogged: true,
      eventDate,
      config: UNCAPPED_CONFIG,
    });

    const expectedDecay = Math.exp(-UNCAPPED_CONFIG.decayLambda * 1);
    const expectedDelta = (9 - 3) * UNCAPPED_CONFIG.wLogged * expectedDecay;
    expect(result.delta.entertainment_and_recreation).toBeCloseTo(expectedDelta);
  });
});
