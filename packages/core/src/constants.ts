/**
 * Tunable constants for scoring/decay algorithms.
 *
 * technical_specification.md §4.2: "MAX_STEP and λ (decay constant) are
 * tunable constants, stored in a config collection so they can be adjusted
 * without redeploying." Since /packages/core has no I/O (CLAUDE.md rule),
 * it cannot read Firestore itself — these are the DEFAULT values. The
 * Cloud Functions layer (/functions/src/lib/remoteConfig.ts) is
 * responsible for reading overrides from the `config` Firestore collection
 * and falling back to these defaults when no override is set. The client
 * uses these same defaults for local preview computations (CLAUDE.md
 * principle #2 — instant UI feedback only, never the persisted value).
 */

/** Weight applied to a *logged* experience's contribution to travel style
 * adjustment. Logged experiences carry ~3x the weight of saved ones
 * (functional_specification.md §2.4). */
export const W_LOGGED = 3;

/** Weight applied to a *saved* experience's contribution. Baseline unit
 * weight — W_LOGGED is defined relative to this. */
export const W_SAVED = 1;

/** Decay constant (λ) in `decayFactor = exp(-λ * daysSinceBaseline)`
 * (technical_specification.md §4.2). Larger λ = faster decay of automatic
 * adjustment strength as time passes since the last baseline reset. */
export const DECAY_LAMBDA = 0.05;

/** Per-category cap on a single automatic adjustment's delta, so no one
 * post/save event can cause a large swing (functional_specification.md
 * §2.4). Expressed in the same 0–10 units as a category score. */
export const MAX_STEP = 0.5;

/** Match-score threshold (post-cosine-similarity, in [0,1]) above which a
 * post/experience is considered "high match" for feed tiering
 * (technical_specification.md §4.3). */
export const HIGH_MATCH_THRESHOLD = 0.7;

/** Variance threshold (across a group's individual match scores against a
 * candidate experience) above which group recommendations are segmented
 * per-collaborator instead of blended into one compromise pick
 * (technical_specification.md §4.4, functional_specification.md §6.2). */
export const GROUP_VARIANCE_THRESHOLD = 0.02;

/** Cap on stored recent-search history (functional_specification.md §5.3:
 * "last 5-10"; technical_specification.md §3.1 field comment: "capped at
 * 10, FIFO"). Technical spec's explicit number wins. */
export const RECENT_SEARCHES_MAX = 10;

/** Max photos per logged experience (functional_specification.md §3.3). */
export const MAX_EXPERIENCE_PHOTOS = 5;

export interface DecayConfig {
  wLogged: number;
  wSaved: number;
  decayLambda: number;
  maxStep: number;
}

export const DEFAULT_DECAY_CONFIG: DecayConfig = {
  wLogged: W_LOGGED,
  wSaved: W_SAVED,
  decayLambda: DECAY_LAMBDA,
  maxStep: MAX_STEP,
};
