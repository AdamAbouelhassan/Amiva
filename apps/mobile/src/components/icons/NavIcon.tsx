import Svg, { Circle, Path } from 'react-native-svg';

export type NavIconName = 'Discovery' | 'Logbook' | 'Planner' | 'Social' | 'Account';

interface NavIconProps {
  name: NavIconName;
  size?: number;
  color: string;
}

/** Solid-filled tab-bar glyphs (brief §4 — no outline icons). 24×24. */
const PATHS: Record<NavIconName, string> = {
  // compass / converging mark, echoes the brand glyph
  Discovery: 'M12 1 A11 11 0 1 0 12 23 A11 11 0 0 0 12 1 Z M16.5 7.5 L13 13 L7.5 16.5 L11 11 Z',
  // open book
  Logbook: 'M12 5 C9.5 3.4 6.5 3 3 3.5 V19.5 C6.5 19 9.5 19.4 12 21 C14.5 19.4 17.5 19 21 19.5 V3.5 C17.5 3 14.5 3.4 12 5 Z',
  // route / pin ahead
  Planner: 'M12 2 C8.7 2 6 4.7 6 8 C6 12.5 12 22 12 22 C12 22 18 12.5 18 8 C18 4.7 15.3 2 12 2 Z M12 10.5 A2.5 2.5 0 1 1 12 5.5 A2.5 2.5 0 0 1 12 10.5 Z',
  // two people
  Social: 'M9 11 A3.5 3.5 0 1 0 9 4 A3.5 3.5 0 0 0 9 11 Z M2 21 C2 16.6 5.1 14 9 14 C12.9 14 16 16.6 16 21 Z M16.5 11 A3 3 0 1 0 16.5 5 A3 3 0 0 0 16.5 11 Z M17 13.2 C20 13.6 22 16 22 20.5 H18.2 C18.2 17.4 17.6 15 17 13.2 Z',
  // person
  Account: 'M12 12 A5 5 0 1 0 12 2 A5 5 0 0 0 12 12 Z M3 22 C3 16.5 7 13.5 12 13.5 C17 13.5 21 16.5 21 22 Z',
};

export function NavIcon({ name, size = 24, color }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'Discovery' ? <Circle cx={12} cy={12} r={2} fill={color} /> : null}
      <Path d={PATHS[name]} fill={color} />
    </Svg>
  );
}
