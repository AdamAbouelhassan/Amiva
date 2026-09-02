/**
 * Reads tunable algorithm constants from the Firestore `config` collection,
 * falling back to the defaults in @amiva/core when no override is set.
 * technical_specification.md §4.2: "MAX_STEP and λ... stored in a config
 * collection so they can be adjusted without redeploying."
 */
import {
  DecayConfig,
  DEFAULT_DECAY_CONFIG,
  GROUP_VARIANCE_THRESHOLD,
  HIGH_MATCH_THRESHOLD,
  STAR_RATING_MULTIPLIER,
} from '@amiva/core';

export interface ConfigStore {
  /** Reads the `config/scoring` document, if present. Any subset of keys
   * may be set; unset keys fall back to core defaults. */
  getScoringConfig(): Promise<Partial<ScoringConfigDoc> | undefined>;
}

export interface ScoringConfigDoc {
  wLogged: number;
  wSaved: number;
  decayLambda: number;
  maxStep: number;
  highMatchThreshold: number;
  groupVarianceThreshold: number;
  /** Partial override of STAR_RATING_MULTIPLIER — only the star values
   * being tuned need to be set; the rest fall back to the core default
   * (taxonomy migration, 2026-09-02). */
  starRatingMultiplier: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
}

export interface ResolvedScoringConfig {
  decay: DecayConfig;
  highMatchThreshold: number;
  groupVarianceThreshold: number;
  starRatingMultiplier: Record<1 | 2 | 3 | 4 | 5, number>;
}

export async function resolveScoringConfig(store: ConfigStore): Promise<ResolvedScoringConfig> {
  const override = (await store.getScoringConfig()) ?? {};
  return {
    decay: {
      wLogged: override.wLogged ?? DEFAULT_DECAY_CONFIG.wLogged,
      wSaved: override.wSaved ?? DEFAULT_DECAY_CONFIG.wSaved,
      decayLambda: override.decayLambda ?? DEFAULT_DECAY_CONFIG.decayLambda,
      maxStep: override.maxStep ?? DEFAULT_DECAY_CONFIG.maxStep,
    },
    highMatchThreshold: override.highMatchThreshold ?? HIGH_MATCH_THRESHOLD,
    groupVarianceThreshold: override.groupVarianceThreshold ?? GROUP_VARIANCE_THRESHOLD,
    starRatingMultiplier: { ...STAR_RATING_MULTIPLIER, ...override.starRatingMultiplier },
  };
}
