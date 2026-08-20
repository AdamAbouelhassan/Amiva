/**
 * Public/Private/Friends selector — used for the account-wide default
 * privacy setting (functional_specification.md §7) and per-trip planned-
 * trip visibility (§4.1). One shared component, 2+ modules.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export type Privacy = 'public' | 'private' | 'friends';

const OPTIONS: { value: Privacy; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends' },
  { value: 'private', label: 'Private' },
];

interface PrivacyPickerProps {
  value: Privacy;
  onChange: (value: Privacy) => void;
}

export function PrivacyPicker({ value, onChange }: PrivacyPickerProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[typography.bodySmall, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  labelSelected: {
    color: colors.textOnAccent,
    fontWeight: '600',
  },
});
