import Svg, { Circle, Path } from 'react-native-svg';
import type { CategoryId } from '@amiva/core';
import { useTheme } from '../../theme';

interface CategoryIconProps {
  category: CategoryId;
  size?: number;
  /** Defaults to the category's own hue for the active theme. */
  color?: string;
}

/**
 * One small SOLID-FILLED glyph per travel-style category (brief §1.1) —
 * drawn to match the weight/roundedness of the brand mark, no thin-line
 * icons anywhere so nothing clashes with `amiva-mark-gradient.png`.
 * 24×24 viewBox.
 *
 * Taxonomy migration (2026-09-02): the pre-migration 8-category set had 8
 * bespoke hand-drawn glyphs, one-to-one. Hand-illustrating 11 *new*
 * glyphs in that same brand style isn't something to improvise
 * unilaterally the way the category color palette's mechanical
 * HSL-rotation fallback could be (tokens.ts) — there's no systematic way
 * to generate a meaningful *icon*. Instead: the 6 old glyphs that still
 * map cleanly onto one of the 19 categories are kept (REUSED_PATHS
 * below); everything else uses one neutral placeholder glyph (a plain
 * dot) rather than forcing a weak/misleading semantic match. Flagged for
 * a real design pass, same treatment the migration prompt calls for on
 * TravelStyleRadar's 19-spoke clutter problem — don't treat this as a
 * finished icon set.
 */
const REUSED_PATHS: Partial<Record<CategoryId, string>> = {
  // museum columns — exact conceptual match, unchanged.
  culture: 'M12 2 L22 7 V9 H2 V7 Z M4 10 H6 V18 H4 Z M9 10 H11 V18 H9 Z M13 10 H15 V18 H13 Z M18 10 H20 V18 H18 Z M2 19 H22 V22 H2 Z',
  // fork + knife — exact conceptual match, unchanged.
  food_and_drink:
    'M6 2 C5.4 2 5 2.4 5 3 V8 C5 8 4 8 4 7 V3 H3 V8 C3 9.7 4.3 11 6 11 V22 H8 V11 C9.7 11 11 9.7 11 8 V3 H10 V7 C10 8 9 8 9 8 V3 C9 2.4 8.6 2 8 2 Z M15 2 C13 2 13 6 13 9 C13 11 14 12 15 12 V22 H17 V2 Z',
  // sun (+ circle, see CENTER_CIRCLE_CATEGORY below) — was "relaxation";
  // health_and_wellness (spa/sauna/yoga) is its closest new-taxonomy home.
  health_and_wellness:
    'M12 6 A6 6 0 1 0 12 18 A6 6 0 0 0 12 6 Z M12 0 L13 4 H11 Z M12 20 L13 24 H11 Z M0 12 L4 11 V13 Z M20 12 L24 11 V13 Z M4 4 L7 6 L5 8 Z M20 4 L18 7 L16 5 Z M4 20 L6 17 L8 19 Z M20 20 L17 18 L19 16 Z',
  // mountain — was "adventure"; natural_features (mountain_peak, etc.) is
  // the more literal home for a mountain glyph specifically.
  natural_features: 'M3 20 L9.5 7 L13 13.5 L15 10 L21 20 Z',
  // music note — was "socialNightlife"; entertainment_and_recreation
  // (night_club, live_music_venue, concert_hall) is its closest home.
  entertainment_and_recreation: 'M18 3 V15.2 A3.5 3.5 0 1 1 16 12 V7 L10 8.6 V17.8 A3.5 3.5 0 1 1 8 15 V5.2 L18 3 Z',
  // backpack — was "budgetBackpacker"; transportation (getting yourself
  // and your gear from place to place) is its closest new-taxonomy home.
  transportation:
    'M9 2 H15 V4 A7 7 0 0 1 20 11 V20 A2 2 0 0 1 18 22 H6 A2 2 0 0 1 4 20 V11 A7 7 0 0 1 9 4 Z M8 12 H16 V17 H8 Z',
  // gem — was "luxury"; shopping (jewelry_store etc.) is its closest home.
  shopping: 'M7 3 H17 L22 9 L12 22 L2 9 Z M8.5 5 L6 8.5 H10 Z M12 5 L10.5 8.5 H13.5 Z M15.5 5 L14 8.5 H18 Z',
};

/** Only `health_and_wellness` reused the old "sun" glyph, which drew an
 * extra center circle to read clearly as a sun rather than a starburst. */
const CENTER_CIRCLE_CATEGORY: CategoryId = 'health_and_wellness';

/** Plain filled dot — the deliberately-neutral placeholder for every
 * category that doesn't have a real bespoke glyph yet (see header). */
const FALLBACK_PATH = 'M12 5 A7 7 0 1 0 12 19 A7 7 0 0 0 12 5 Z';

export function CategoryIcon({ category, size = 20, color }: CategoryIconProps) {
  const t = useTheme();
  const fill = color ?? t.category(category);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={REUSED_PATHS[category] ?? FALLBACK_PATH} fill={fill} />
      {category === CENTER_CIRCLE_CATEGORY ? <Circle cx={12} cy={12} r={5.2} fill={fill} /> : null}
    </Svg>
  );
}
