import { Ionicons } from '@expo/vector-icons';

export type NavIconName = 'Discovery' | 'Logbook' | 'Planner' | 'Social' | 'Account';

interface NavIconProps {
  name: NavIconName;
  size?: number;
  color: string;
  /** Filled glyph when the tab is selected, hollow outline when not
   * (Spotify-style — brief §4). */
  focused?: boolean;
}

const GLYPH: Record<NavIconName, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  Discovery: { on: 'compass', off: 'compass-outline' },
  Logbook: { on: 'book', off: 'book-outline' },
  Planner: { on: 'map', off: 'map-outline' },
  Social: { on: 'people', off: 'people-outline' },
  Account: { on: 'person-circle', off: 'person-circle-outline' },
};

export function NavIcon({ name, size = 24, color, focused }: NavIconProps) {
  const g = GLYPH[name];
  return <Ionicons name={focused ? g.on : g.off} size={size} color={color} />;
}
