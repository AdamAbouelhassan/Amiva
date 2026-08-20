/**
 * The 8-category rating sliders — used at account onboarding, in manual
 * travel-style editing (Settings), and when setting an experience's own
 * category profile at posting time (functional_specification.md §2.3,
 * §2.4, §2.5). One shared implementation, promoted to top-level
 * /components since 2+ modules (Account, Logbook) use it.
 */
import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_MAX, CATEGORY_MIN, TRAVEL_STYLE_CATEGORIES, TravelStyleVector } from '@amiva/core';
import { CATEGORY_LABELS, colors, spacing, typography } from '../theme';

interface TravelStyleSlidersProps {
  value: TravelStyleVector;
  onChange: (next: TravelStyleVector) => void;
  disabled?: boolean;
}

export function TravelStyleSliders({ value, onChange, disabled }: TravelStyleSlidersProps) {
  return (
    <View style={styles.container}>
      {TRAVEL_STYLE_CATEGORIES.map((category) => (
        <View key={category} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={typography.body}>{CATEGORY_LABELS[category]}</Text>
            <Text style={styles.value}>{value[category].toFixed(0)}</Text>
          </View>
          <Slider
            minimumValue={CATEGORY_MIN}
            maximumValue={CATEGORY_MAX}
            step={1}
            value={value[category]}
            disabled={disabled}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
            onValueChange={(next) => onChange({ ...value, [category]: next })}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    ...typography.body,
    fontWeight: '600',
    color: colors.accent,
  },
});
