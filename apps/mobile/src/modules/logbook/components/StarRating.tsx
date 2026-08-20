import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../../theme';

interface StarRatingProps {
  value: number; // 1-5
  onChange: (value: number) => void;
}

/** 1-5 stars, separate from the category sliders
 * (functional_specification.md §3.3). */
export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} accessibilityRole="button" accessibilityLabel={`${star} stars`}>
          <Text style={[styles.star, star <= value && styles.starFilled]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  star: {
    fontSize: 28,
    color: colors.border,
  },
  starFilled: {
    color: colors.accent,
  },
});
