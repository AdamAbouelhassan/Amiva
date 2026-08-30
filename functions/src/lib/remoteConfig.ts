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
}

export interface ResolvedScoringConfig {
  decay: DecayConfig;
  highMatchThreshold: number;
  groupVarianceThreshold: number;
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
  };
}
