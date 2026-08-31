/**
 * Public/Private/Friends selector — used for the account-wide default
 * privacy setting (functional_specification.md §7) and per-trip planned-
 * trip visibility (§4.1). One shared component, 2+ modules.
 */
import { Pressable, Text, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';

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
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.chip,
              borderWidth: 1,
              borderColor: selected ? t.colors.accent : t.colors.border,
              backgroundColor: selected ? t.colors.accent : t.colors.surface,
            }}
          >
            <Text
              style={[
                t.type.label,
                { color: selected ? t.colors.textOnAccent : t.colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
