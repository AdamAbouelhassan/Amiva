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
 * 24×24 viewBox, all-positive subpaths (no holes — nonzero fill).
 *
 * Taxonomy migration (2026-09-02) + 19→9 reduction: 6 of the 9 glyphs are
 * the old hand-drawn ones that still map cleanly; `lodging`,
 * `places_of_worship` and `sports` got new glyphs in the same style
 * (2026-09-03). A full design pass is still worthwhile but every category
 * now has a real glyph — `TravelStyleRadar` uses them as axis markers.
 */
export const CATEGORY_GLYPH_PATHS: Record<CategoryId, string> = {
  // museum columns
  culture:
    'M12 2 L22 7 V9 H2 V7 Z M4 10 H6 V18 H4 Z M9 10 H11 V18 H9 Z M13 10 H15 V18 H13 Z M18 10 H20 V18 H18 Z M2 19 H22 V22 H2 Z',
  // fork + knife
  food_and_drink:
    'M6 2 C5.4 2 5 2.4 5 3 V8 C5 8 4 8 4 7 V3 H3 V8 C3 9.7 4.3 11 6 11 V22 H8 V11 C9.7 11 11 9.7 11 8 V3 H10 V7 C10 8 9 8 9 8 V3 C9 2.4 8.6 2 8 2 Z M15 2 C13 2 13 6 13 9 C13 11 14 12 15 12 V22 H17 V2 Z',
  // sun (+ centre circle, see CENTER_CIRCLE_CATEGORY) — spa / sauna / yoga
  health_and_wellness:
    'M12 6 A6 6 0 1 0 12 18 A6 6 0 0 0 12 6 Z M12 0 L13 4 H11 Z M12 20 L13 24 H11 Z M0 12 L4 11 V13 Z M20 12 L24 11 V13 Z M4 4 L7 6 L5 8 Z M20 4 L18 7 L16 5 Z M4 20 L6 17 L8 19 Z M20 20 L17 18 L19 16 Z',
  // mountain
  natural_features: 'M3 20 L9.5 7 L13 13.5 L15 10 L21 20 Z',
  // music note — night_club / live_music_venue / concert_hall
  entertainment_and_recreation:
    'M18 3 V15.2 A3.5 3.5 0 1 1 16 12 V7 L10 8.6 V17.8 A3.5 3.5 0 1 1 8 15 V5.2 L18 3 Z',
  // gem — jewelry_store etc.
  shopping: 'M7 3 H17 L22 9 L12 22 L2 9 Z M8.5 5 L6 8.5 H10 Z M12 5 L10.5 8.5 H13.5 Z M15.5 5 L14 8.5 H18 Z',
  // bed — headboard post, mattress base with a rounded foot, tucked pillow
  lodging:
    'M2 5 H4 V19 H2 Z M4.5 12 H19 A3 3 0 0 1 22 15 V19 H20 V16 H4.5 Z M4.5 8.5 H11 A2 2 0 0 1 13 10.5 V12 H4.5 Z',
  // domed building with an arched entrance — deliberately non-denominational
  places_of_worship:
    'M11.3 0.5 H12.7 V2.5 H11.3 Z M12 2 A5 5 0 0 1 17 7 V9 H7 V7 A5 5 0 0 1 12 2 Z M5 10 H19 V21 H14 V16 A2 2 0 0 0 10 16 V21 H5 Z M4 21 H20 V23 H4 Z',
  // pennant flag on a pole — competition / racing / golf
  sports: 'M5 2 H7 V22 H5 Z M7 3 L20 6.5 L7 10 Z',
};

/** Only `health_and_wellness`'s "sun" glyph needs an extra centre circle to
 * read as a sun rather than a starburst. */
const CENTER_CIRCLE_CATEGORY: CategoryId = 'health_and_wellness';

/** The raw glyph for a category — for callers drawing inside their own
 * `<Svg>` (e.g. TravelStyleRadar's axis markers). `circle` = also stamp a
 * centre `<Circle cx=12 cy=12 r=5.2>`. */
export function categoryGlyph(category: CategoryId): { d: string; circle: boolean } {
  return { d: CATEGORY_GLYPH_PATHS[category], circle: category === CENTER_CIRCLE_CATEGORY };
}

export function CategoryIcon({ category, size = 20, color }: CategoryIconProps) {
  const t = useTheme();
  const fill = color ?? t.category(category);
  const glyph = categoryGlyph(category);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={glyph.d} fill={fill} />
      {glyph.circle ? <Circle cx={12} cy={12} r={5.2} fill={fill} /> : null}
    </Svg>
  );
}
