/**
 * A logged experience's 0–4 `priceLevelAffinity` (server-derived from the
 * place's Google `priceLevel`) → a "$"–"$$$$" badge string, or `undefined`
 * when the place had no price signal (parks, most nature, much of culture —
 * common, so callers just omit the badge).
 */
import { priceLevelToValue } from '@amiva/core';

export function priceLevelLabel(affinity?: number | null): string | undefined {
  if (affinity == null) return undefined;
  const tier = Math.round(Math.min(4, Math.max(0, affinity)));
  return tier === 0 ? 'Free' : '$'.repeat(tier);
}

/** Same badge from a Google Places (New) `priceLevel` enum string
 * (`PRICE_LEVEL_MODERATE` → "$$"); `undefined` when unpriced/unspecified.
 * Used on the transient Discovery place cards that have the raw enum but no
 * stored 0–4 affinity yet. */
export function priceLevelLabelFromEnum(priceLevel?: string | null): string | undefined {
  return priceLevelLabel(priceLevelToValue(priceLevel ?? undefined));
}
