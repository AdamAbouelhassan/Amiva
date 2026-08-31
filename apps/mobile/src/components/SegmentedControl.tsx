import { Pressable, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** A pill-track segmented control (brief §3.4 — Trending scopes, and any
 * other small mutually-exclusive choice). */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.colors.surfaceAlt,
        borderRadius: radius.chip,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: spacing.xs,
              borderRadius: radius.chip - 3,
              backgroundColor: active ? t.colors.surface : 'transparent',
            }}
          >
            <Text
              style={[
                t.type.label,
                { color: active ? t.colors.textPrimary : t.colors.textSecondary },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
