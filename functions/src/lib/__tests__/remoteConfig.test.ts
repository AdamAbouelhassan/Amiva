import { DEFAULT_DECAY_CONFIG, GROUP_VARIANCE_THRESHOLD, HIGH_MATCH_THRESHOLD, STAR_RATING_MULTIPLIER } from '@amiva/core';
import { ConfigStore, resolveScoringConfig } from '../remoteConfig';

describe('resolveScoringConfig', () => {
  it('falls back to core defaults when no config doc exists', async () => {
    const store: ConfigStore = { getScoringConfig: async () => undefined };
    const resolved = await resolveScoringConfig(store);
    expect(resolved.decay).toEqual(DEFAULT_DECAY_CONFIG);
    expect(resolved.highMatchThreshold).toBe(HIGH_MATCH_THRESHOLD);
    expect(resolved.groupVarianceThreshold).toBe(GROUP_VARIANCE_THRESHOLD);
    expect(resolved.starRatingMultiplier).toEqual(STAR_RATING_MULTIPLIER);
  });

  it('applies a partial override without disturbing unset fields', async () => {
    const store: ConfigStore = { getScoringConfig: async () => ({ maxStep: 1.5 }) };
    const resolved = await resolveScoringConfig(store);
    expect(resolved.decay.maxStep).toBe(1.5);
    expect(resolved.decay.wLogged).toBe(DEFAULT_DECAY_CONFIG.wLogged);
  });

  it('merges a partial starRatingMultiplier override over the core defaults, key by key', async () => {
    const store: ConfigStore = { getScoringConfig: async () => ({ starRatingMultiplier: { 5: 1.5 } }) };
    const resolved = await resolveScoringConfig(store);
    expect(resolved.starRatingMultiplier[5]).toBe(1.5);
    expect(resolved.starRatingMultiplier[1]).toBe(STAR_RATING_MULTIPLIER[1]);
    expect(resolved.starRatingMultiplier[4]).toBe(STAR_RATING_MULTIPLIER[4]);
  });
});
