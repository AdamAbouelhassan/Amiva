import { Pressable, Text, View } from 'react-native';
import type { CategoryId } from '@amiva/core';
import { CATEGORY_LABELS, radius, spacing, useTheme } from '../theme';
import { CategoryIcon } from './icons/CategoryIcon';

interface CategoryChipProps {
  category: CategoryId;
  selected?: boolean;
  onPress?: () => void;
}

/** Category label + its filled glyph + its hue — the consistent way a
 * single travel-style category is shown as a tag (brief §1.1 mapping).
 * Selected = soft hue tint + hue border + hue-toned (AA-safe) text, rather
 * than a saturated fill that fails contrast under the label. */
export function CategoryChip({ category, selected, onPress }: CategoryChipProps) {
  const t = useTheme();
  const hue = t.category(category);
  const textHue = t.categoryText(category);

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? hue : t.colors.border,
        backgroundColor: selected ? hue + '24' : t.colors.surface,
      }}
    >
      <CategoryIcon category={category} size={13} color={selected ? textHue : hue} />
      <Text style={[t.type.caption, { color: selected ? textHue : t.colors.textPrimary }]}>
        {CATEGORY_LABELS[category]}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }}>
      {body}
    </Pressable>
  );
}
