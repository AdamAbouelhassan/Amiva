import Svg, { Circle, Path } from 'react-native-svg';
import type { TravelStyleCategory } from '@amiva/core';
import { useTheme } from '../../theme';

interface CategoryIconProps {
  category: TravelStyleCategory;
  size?: number;
  /** Defaults to the category's own hue for the active theme. */
  color?: string;
}

/**
 * One small SOLID-FILLED glyph per travel-style category (brief §1.1) —
 * drawn to match the weight/roundedness of the brand mark, no thin-line
 * icons anywhere so nothing clashes with `amiva-mark-gradient.png`.
 * 24×24 viewBox.
 */
const PATHS: Record<TravelStyleCategory, string> = {
  // mountain
  adventure: 'M3 20 L9.5 7 L13 13.5 L15 10 L21 20 Z',
  // museum columns
  culture: 'M12 2 L22 7 V9 H2 V7 Z M4 10 H6 V18 H4 Z M9 10 H11 V18 H9 Z M13 10 H15 V18 H13 Z M18 10 H20 V18 H18 Z M2 19 H22 V22 H2 Z',
  // fork + knife
  foodie: 'M6 2 C5.4 2 5 2.4 5 3 V8 C5 8 4 8 4 7 V3 H3 V8 C3 9.7 4.3 11 6 11 V22 H8 V11 C9.7 11 11 9.7 11 8 V3 H10 V7 C10 8 9 8 9 8 V3 C9 2.4 8.6 2 8 2 Z M15 2 C13 2 13 6 13 9 C13 11 14 12 15 12 V22 H17 V2 Z',
  // music note
  socialNightlife: 'M18 3 V15.2 A3.5 3.5 0 1 1 16 12 V7 L10 8.6 V17.8 A3.5 3.5 0 1 1 8 15 V5.2 L18 3 Z',
  // backpack
  budgetBackpacker: 'M9 2 H15 V4 A7 7 0 0 1 20 11 V20 A2 2 0 0 1 18 22 H6 A2 2 0 0 1 4 20 V11 A7 7 0 0 1 9 4 Z M8 12 H16 V17 H8 Z',
  // sun
  relaxation: 'M12 6 A6 6 0 1 0 12 18 A6 6 0 0 0 12 6 Z M12 0 L13 4 H11 Z M12 20 L13 24 H11 Z M0 12 L4 11 V13 Z M20 12 L24 11 V13 Z M4 4 L7 6 L5 8 Z M20 4 L18 7 L16 5 Z M4 20 L6 17 L8 19 Z M20 20 L17 18 L19 16 Z',
  // leaf
  nature: 'M20 3 C10 3 4 9 4 18 C4 19 4.3 20 4.7 21 C7 15 11 12 17 10 C12 13 8.5 16.5 6.5 21.5 C7.5 22 9 22 10 22 C19 22 21 12 20 3 Z',
  // gem
  luxury: 'M7 3 H17 L22 9 L12 22 L2 9 Z M8.5 5 L6 8.5 H10 Z M12 5 L10.5 8.5 H13.5 Z M15.5 5 L14 8.5 H18 Z',
};

export function CategoryIcon({ category, size = 20, color }: CategoryIconProps) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={PATHS[category]} fill={color ?? t.category(category)} />
      {category === 'relaxation' ? <Circle cx={12} cy={12} r={5.2} fill={color ?? t.category(category)} /> : null}
    </Svg>
  );
}
