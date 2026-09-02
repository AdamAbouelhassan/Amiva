/**
 * The authoritative "can this Google place enter Amiva as a loggable /
 * discoverable experience?" check (taxonomy-reduction pass, 2026-09-02 —
 * "Layer 2").
 *
 * Two-layer gating: the Places request layer (`includedType`) is a
 * best-effort, cost-saving filter that CAN'T be applied exhaustively (Text
 * Search takes one type) and structurally can't express the places-of-
 * worship landmark condition. This function is the backstop that actually
 * guarantees automotive shops, hospitals, government offices and non-
 * landmark neighbourhood churches never get persisted to `places/{id}` or
 * surfaced. Callers hard-reject a failing place (don't persist, don't
 * return it) — see functions/src/triggers/upsertPlace.ts and
 * functions/src/lib/placeRecommendations.ts.
 */
import {
  LANDMARK_SIGNAL_TYPES,
  PLACE_OF_WORSHIP_MIN_RATING_COUNT,
  PLACE_OF_WORSHIP_TYPES,
} from './constants';
import { getCategoryForType } from './googlePlaceTaxonomy';

const POW = new Set<string>(PLACE_OF_WORSHIP_TYPES);
const LANDMARK = new Set<string>(LANDMARK_SIGNAL_TYPES);

export interface PlaceGateInput {
  /** Google Places (New) `primaryType`. */
  primaryType?: string;
  /** The full `types` array (New responses carry several per place). */
  types?: string[];
  /** Needed only for the places-of-worship popularity fallback. */
  userRatingCount?: number;
}

export interface PlaceGateResult {
  approved: boolean;
  /** Machine-readable reject reason, for logging / a client message. */
  reason?: 'type_not_approved' | 'pow_no_landmark';
}

/** The single type used to categorise a place — `primaryType` when Google
 * gave one, otherwise the first `types` entry that our (pruned) taxonomy
 * still recognises. */
export function resolvePlaceType(input: PlaceGateInput): string | undefined {
  if (input.primaryType && getCategoryForType(input.primaryType)) return input.primaryType;
  return (input.types ?? []).find((t) => !!getCategoryForType(t));
}

export function isApprovedPlace(
  input: PlaceGateInput,
  minRatingCount: number = PLACE_OF_WORSHIP_MIN_RATING_COUNT,
): PlaceGateResult {
  const type = resolvePlaceType(input);
  if (!type) return { approved: false, reason: 'type_not_approved' };

  // Non-approved primaryType with an approved secondary type is allowed —
  // that's Google's general→specific nesting, and the category assignment
  // keys off `type` (resolvePlaceType) not `primaryType` regardless.
  if (POW.has(type)) {
    const hasLandmarkType = (input.types ?? []).some((t) => LANDMARK.has(t));
    const popularEnough =
      typeof input.userRatingCount === 'number' && input.userRatingCount >= minRatingCount;
    if (!hasLandmarkType && !popularEnough) {
      return { approved: false, reason: 'pow_no_landmark' };
    }
  }

  return { approved: true };
}
