import { ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { motion, spacing, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  /** Filled-accent treatment (e.g. a toggled-on Save). */
  active?: boolean;
  /** `danger` = red glyph on a muted-red disc, for destructive actions. */
  tone?: 'default' | 'danger';
  /** `overlay` = white glyph on a dark scrim disc, for buttons sat on a photo. */
  variant?: 'default' | 'overlay';
  loading?: boolean;
  size?: number;
}

/** A circular icon action — the compact stand-in for a small text button on
 * cards (Save / Log / Share / Remove). Scales down while held and springs
 * back on release (UI thread) so the tap always feels instant. The `active`
 * visual (icon + fill) should come from optimistic state so it flips in the
 * same tick as the tap. */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  active,
  tone = 'default',
  variant = 'default',
  loading,
  size = 34,
}: IconButtonProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const danger = tone === 'danger';
  const overlay = variant === 'overlay';

  const fg = active
    ? t.colors.textOnAccent
    : overlay
      ? t.colors.onScrim
      : danger
        ? t.colors.danger
        : t.colors.accent;
  const bg = active
    ? t.colors.accent
    : overlay
      ? t.colors.overlay
      : danger
        ? t.colors.dangerMuted
        : t.colors.accentMuted;

  const press = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [], opacity: press.value ? 0.6 : 1 };
    return {
      transform: [{ scale: 1 - press.value * (1 - motion.pressScale) }],
      opacity: 1 - press.value * 0.2,
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = reduceMotion ? 1 : withTiming(1, { duration: 55 });
      }}
      onPressOut={() => {
        press.value = reduceMotion ? 0 : withSpring(0, motion.press);
      }}
      disabled={loading}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active, busy: !!loading }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
          },
          animStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <Ionicons name={name} size={Math.round(size * 0.52)} color={fg} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export const ICON_ROW_GAP = spacing.xs;
