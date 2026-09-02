import { DecayConfig } from '../constants';
import { computeStyleAdjustment } from '../travelStyleDecay';
import { bayesianRating, computePriceAffinityAdjustment, priceLevelToValue } from '../priceAffinity';
import { vector } from './testUtils';

describe('priceLevelToValue', () => {
  it('maps each Google (New) priceLevel enum to 0–4', () => {
    expect(priceLevelToValue('PRICE_LEVEL_FREE')).toBe(0);
    expect(priceLevelToValue('PRICE_LEVEL_INEXPENSIVE')).toBe(1);
    expect(priceLevelToValue('PRICE_LEVEL_MODERATE')).toBe(2);
    expect(priceLevelToValue('PRICE_LEVEL_EXPENSIVE')).toBe(3);
    expect(priceLevelToValue('PRICE_LEVEL_VERY_EXPENSIVE')).toBe(4);
  });

  it('returns undefined (no signal) for unspecified / unknown / absent', () => {
    expect(priceLevelToValue('PRICE_LEVEL_UNSPECIFIED')).toBeUndefined();
    expect(priceLevelToValue(undefined)).toBeUndefined();
    expect(priceLevelToValue(null)).toBeUndefined();
    expect(priceLevelToValue('something_new')).toBeUndefined();
  });
});

describe('computePriceAffinityAdjustment', () => {
  const config: DecayConfig = { wLogged: 3, wSaved: 1, decayLambda: 0.05, maxStep: 0.5 };
  const baseline = new Date('2026-01-01T00:00:00Z');
  const event = new Date('2026-01-11T00:00:00Z'); // 10 days later

  it('matches computeStyleAdjustment exactly for the same inputs (one axis)', () => {
    const current = 1;
    const target = 4;
    const scalar = computePriceAffinityAdjustment({
      current,
      travelStyleLastUpdated: baseline,
      experienceValue: target,
      isLogged: true,
      eventDate: event,
      config,
    });
    const asVector = computeStyleAdjustment({
      currentVector: vector({ culture: current }),
      travelStyleLastUpdated: baseline,
      experienceVector: vector({ culture: target }),
      isLogged: true,
      eventDate: event,
      config,
    });
    expect(scalar.delta).toBeCloseTo(asVector.delta.culture);
    expect(scalar.priceLevelAffinity).toBeCloseTo(asVector.travelStyle.culture);
  });

  it('applies weightOverride (star-rating multiplier) exactly like the vector nudge', () => {
    const withStar1 = computePriceAffinityAdjustment({
      current: 0,
      travelStyleLastUpdated: baseline,
      experienceValue: 4,
      isLogged: true,
      eventDate: baseline,
      config,
      weightOverride: 0, // 1-star: no pull
    });
    expect(withStar1.delta).toBe(0);

    const withStar5 = computePriceAffinityAdjustment({
      current: 0,
      travelStyleLastUpdated: baseline,
      experienceValue: 4,
      isLogged: true,
      eventDate: baseline,
      config,
      weightOverride: config.wLogged * 1.3,
    });
    expect(withStar5.delta).toBe(config.maxStep); // capped
  });

  it('clamps the result to [0, 4]', () => {
    const r = computePriceAffinityAdjustment({
      current: 3.9,
      travelStyleLastUpdated: baseline,
      experienceValue: 4,
      isLogged: false,
      eventDate: baseline,
      config: { ...config, maxStep: 5 },
    });
    expect(r.priceLevelAffinity).toBeLessThanOrEqual(4);
  });
});

describe('bayesianRating', () => {
  it('pulls a thinly-reviewed rating toward the prior', () => {
    const thin = bayesianRating(5.0, 3);
    const deep = bayesianRating(4.6, 3000);
    expect(deep).toBeGreaterThan(thin); // 4.6 from 3k beats 5.0 from 3
  });

  it('falls back to the prior mean when rating/count are missing', () => {
    expect(bayesianRating(undefined, undefined, 3.8, 50)).toBeCloseTo(3.8);
  });
});
