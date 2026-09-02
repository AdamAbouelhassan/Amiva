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
 * §2.4). Expressed in the same 0–5 units as a category score (2026-09-03:
 * halved from 0.5 alongside the 0–10 → 0–5 rescale). */
export const MAX_STEP = 0.25;

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

/** How many of the viewer's top categories (topCategories, profileInsights.ts)
 * become Feed/Trending sections (feedSections.ts) in the Discover rebuild —
 * "organized by the activities that most match your personal travel
 * style." Matches the existing "top 3 categories" convention already used
 * for profile badges (functional_specification.md §2.6). */
export const FEED_SECTION_COUNT = 3;

/** Minimum categoryScores[category] (0–5) for an item to belong to that
 * category's Feed/Trending section (feedSections.ts). An item can clear
 * the threshold for more than one category and appear in multiple
 * sections. (2026-09-03: halved from 6 alongside the 0–10 → 0–5 rescale.) */
export const CATEGORY_SECTION_THRESHOLD = 3;

/** How strongly a *logged* experience's star rating modulates the decay
 * nudge to the logger's own travelStyle (taxonomy migration, 2026-09-02 —
 * docs/claude_code_prompt_taxonomy_migration.md's "star-rating-modulated
 * nudge"). A 1-star experience the user hated shouldn't pull their style
 * toward it at all; a 5-star one should pull slightly harder than the
 * flat W_LOGGED behavior this replaces (4 stars = parity with the old
 * flat weighting). Deliberately NOT part of DecayConfig/DEFAULT_DECAY_CONFIG
 * below — it only ever applies to the logged path (a save has no star
 * rating), so it's threaded through separately in
 * functions/src/lib/travelStyleUpdate.ts rather than folded into the
 * generic decay formula in travelStyleDecay.ts. Overridable via
 * remoteConfig.ts like the other constants here. */
export const STAR_RATING_MULTIPLIER: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 0.4,
  3: 0.7,
  4: 1.0,
  5: 1.3,
};

/** Looks up STAR_RATING_MULTIPLIER defensively — clamps/rounds an
 * arbitrary numeric rating into the valid 1-5 range first, rather than
 * trusting the caller (mirrors clampCategoryValue's defensiveness in
 * types.ts), so a malformed/out-of-range rating degrades to the nearest
 * valid multiplier instead of returning undefined. */
export function getStarRatingMultiplier(
  rating: number,
  table: Record<1 | 2 | 3 | 4 | 5, number> = STAR_RATING_MULTIPLIER,
): number {
  const clamped = Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5;
  return table[clamped];
}

/** A place whose `primaryType` is one of the 6 places-of-worship types
 * only counts as a loggable/discoverable experience if it *also* carries a
 * landmark signal OR has at least this many Google reviews (taxonomy-
 * reduction pass, 2026-09-02 — see placeGate.ts). Google's landmark-type
 * tagging is inconsistent, so this popularity fallback catches a genuinely
 * famous site that Google didn't tag `tourist_attraction`.
 *
 * PLACEHOLDER — this is an untuned guess. Real calibration needs the
 * review-count distribution of known-famous vs. ordinary places of
 * worship; the follow-up plan is to log (not gate on) the counts for a
 * while first. Overridable via remoteConfig.ts like the others. */
export const PLACE_OF_WORSHIP_MIN_RATING_COUNT = 500;

/** Landmark `types` that qualify a place of worship for inclusion (any one
 * is sufficient). First pass — spot-check against real query results
 * before trusting it (taxonomy-reduction pass "Ask me before"). */
export const PLACE_OF_WORSHIP_TYPES = [
  'church',
  'buddhist_temple',
  'hindu_temple',
  'mosque',
  'shinto_shrine',
  'synagogue',
] as const;

export const LANDMARK_SIGNAL_TYPES = [
  'tourist_attraction',
  'historical_landmark',
  'cultural_landmark',
  'historical_place',
] as const;

/** Google Places (New) `priceLevel` enum → a 0–4 numeric scale, the input
 * to the `priceLevelAffinity` scalar (priceAffinity.ts). Taxonomy-
 * reduction pass, 2026-09-02: restores a sense of *how upscale* an
 * experience is, independent of *what kind* — something the 8-category
 * model had (Luxury / Budget axes) and the pure venue-type taxonomy lost.
 * `PRICE_LEVEL_UNSPECIFIED` / the field being absent (parks, most nature,
 * much of Culture never return one) = **no signal** — callers skip the
 * nudge entirely rather than inventing a default. */
export const PRICE_LEVEL_VALUES: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export const PRICE_AFFINITY_MIN = 0;
export const PRICE_AFFINITY_MAX = 4;

/** The neutral starting value for a new user's `priceLevelAffinity` — no
 * manual control exists, so "midpoint, no preference yet" until logged
 * experiences nudge it. */
export const PRICE_AFFINITY_NEUTRAL = 2;

export function clampPriceAffinity(value: number): number {
  if (Number.isNaN(value)) return PRICE_AFFINITY_NEUTRAL;
  return Math.min(PRICE_AFFINITY_MAX, Math.max(PRICE_AFFINITY_MIN, value));
}

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
