import { ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, useTheme } from '../theme';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  /** Filled-accent treatment (e.g. a toggled-on Save). */
  active?: boolean;
  /** `danger` = red glyph on a muted-red disc, for destructive actions. */
  tone?: 'default' | 'danger';
  loading?: boolean;
  size?: number;
}

/** A circular icon action — the compact stand-in for a small text button on
 * cards (Save / Log / Share / Remove). */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  active,
  tone = 'default',
  loading,
  size = 34,
}: IconButtonProps) {
  const t = useTheme();
  const danger = tone === 'danger';
  const fg = active ? t.colors.textOnAccent : danger ? t.colors.danger : t.colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!active, busy: !!loading }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active
          ? t.colors.accent
          : danger
            ? t.colors.dangerMuted
            : t.colors.accentMuted,
        opacity: pressed || loading ? 0.6 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Ionicons name={name} size={Math.round(size * 0.52)} color={fg} />
      )}
    </Pressable>
  );
}

export const ICON_ROW_GAP = spacing.xs;
