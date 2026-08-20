/**
 * The match-%/compatibility-% pill shown on feed posts and friend
 * profiles (functional_specification.md §2.6, §6.4) — one shared
 * component so the accent-color treatment stays consistent everywhere a
 * match score appears.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface MatchBadgeProps {
  matchPercent: number;
  onPress?: () => void;
}

export function MatchBadge({ matchPercent, onPress }: MatchBadgeProps) {
  const content = (
    <View style={styles.badge}>
      <Text style={styles.percent}>{matchPercent}%</Text>
      <Text style={styles.label}>match</Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${matchPercent}% match, view detail`}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.accentMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    gap: spacing.xxs,
  },
  percent: {
    ...typography.subtitle,
    color: colors.accent,
  },
  label: {
    ...typography.caption,
    color: colors.accent,
  },
});
