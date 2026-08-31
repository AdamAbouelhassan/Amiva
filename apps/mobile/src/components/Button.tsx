import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, shadow, spacing, useTheme } from '../theme';

type Variant = 'primary' | 'secondary' | 'warm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** `warm` = coral, for forward-looking / Planner CTAs (brief §3.3). */
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const t = useTheme();
  const busy = disabled || loading;

  const fills: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: t.colors.accent, fg: t.colors.textOnAccent, border: t.colors.accent },
    warm: { bg: t.colors.accentWarm, fg: t.colors.textOnAccent, border: t.colors.accentWarm },
    secondary: { bg: 'transparent', fg: t.colors.accent, border: t.colors.accent },
  };
  const c = fills[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: c.bg, borderColor: c.border },
        variant !== 'secondary' && !busy && shadow.resting,
        busy && styles.disabled,
        pressed && !busy && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <Text style={[styles.label, { color: c.fg, fontFamily: t.type.subtitle.fontFamily }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: { fontSize: 16 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
