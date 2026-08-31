import Svg, { Circle, Path } from 'react-native-svg';
import type { NotificationType } from '../../repositories/types';
import { useTheme } from '../../theme';

interface NotificationIconProps {
  type: NotificationType;
  size?: number;
}

/** Solid-filled glyph on a brand-tinted disc per notification type
 * (spec §6.5, brief §3.6 — category iconography, not generic bell/heart).
 * Glyph is always `textPrimary` so it stays legible; the disc tint carries
 * the colour meaning. */
const SPEC: Record<NotificationType, { path: string; tone: 'accent' | 'warm' | 'success' | 'info' }> = {
  trip_completed: { path: 'M9 16.2 L4.8 12 L3.4 13.4 L9 19 L21 7 L19.6 5.6 Z', tone: 'success' },
  friend_added: {
    path: 'M10 12 A5 5 0 1 0 10 2 A5 5 0 0 0 10 12 Z M2 21 C2 16 5.6 13.5 10 13.5 C11 13.5 12 13.6 12.9 13.9 V21 Z M18 13 H20 V16 H23 V18 H20 V21 H18 V18 H15 V16 H18 Z',
    tone: 'accent',
  },
  group_trip_joined: {
    path: 'M8 11 A3.5 3.5 0 1 0 8 4 A3.5 3.5 0 0 0 8 11 Z M1 21 C1 16.6 4.1 14 8 14 C11.9 14 15 16.6 15 21 Z M16 11 A3 3 0 1 0 16 5 A3 3 0 0 0 16 11 Z M16.5 13.2 C19.5 13.6 22 16 22 20.5 H17.5 C17.5 17.4 17.1 15 16.5 13.2 Z',
    tone: 'warm',
  },
  new_match: { path: 'M12 2 L15 8 L21 9 L16.5 13.5 L18 20 L12 16.5 L6 20 L7.5 13.5 L3 9 L9 8 Z', tone: 'accent' },
};

export function NotificationIcon({ type, size = 22 }: NotificationIconProps) {
  const t = useTheme();
  const { path, tone } = SPEC[type];
  const discFill = {
    accent: t.colors.accentMuted,
    warm: t.colors.accentWarmMuted,
    success: t.isDark ? '#24382C' : '#DDEFE2',
    info: t.colors.info,
  }[tone];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill={discFill} />
      <Path d={path} fill={t.colors.textPrimary} />
    </Svg>
  );
}
