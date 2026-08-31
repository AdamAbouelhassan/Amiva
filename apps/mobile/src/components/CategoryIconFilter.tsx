import { Pressable, Text, View } from 'react-native';
import { TRAVEL_STYLE_CATEGORIES, TravelStyleCategory } from '@amiva/core';
import { CATEGORY_LABELS, useTheme } from '../theme';
import { CategoryIcon } from './icons/CategoryIcon';

interface CategoryIconFilterProps {
  /** undefined = no category filter (all). */
  value: TravelStyleCategory | undefined;
  onChange: (next: TravelStyleCategory | undefined) => void;
}

/** Minimalist icon-only category filter (brief): the 8 category glyphs in
 * one row that divides the available width evenly — no sideways scroll.
 * The active category's name shows as a small caption so it stays legible
 * without labelling every icon. */
export function CategoryIconFilter({ value, onChange }: CategoryIconFilterProps) {
  const t = useTheme();

  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {TRAVEL_STYLE_CATEGORIES.map((cat) => {
          const selected = value === cat;
          const hue = t.category(cat);
          return (
            <Pressable
              key={cat}
              onPress={() => onChange(selected ? undefined : cat)}
              accessibilityRole="button"
              accessibilityLabel={CATEGORY_LABELS[cat]}
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: selected ? hue : t.colors.border,
                backgroundColor: selected ? hue : t.colors.surface,
              }}
            >
              <CategoryIcon category={cat} size={17} color={selected ? t.colors.textOnAccent : hue} />
            </Pressable>
          );
        })}
      </View>
      <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>
        {value ? CATEGORY_LABELS[value] : 'All categories'}
      </Text>
    </View>
  );
}
