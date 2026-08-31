import { Pressable, Text, View } from 'react-native';
import { spacing, useTheme } from '../../../theme';

interface StarRatingProps {
  value: number; // 1-5
  onChange: (value: number) => void;
}

/** 1-5 stars, separate from the category sliders
 * (functional_specification.md §3.3). */
export function StarRating({ value, onChange }: StarRatingProps) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xxs }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          accessibilityRole="button"
          accessibilityLabel={`${star} stars`}
        >
          <Text style={{ fontSize: 28, color: star <= value ? t.colors.warning : t.colors.border }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}
