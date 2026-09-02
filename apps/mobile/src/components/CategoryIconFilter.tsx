import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CATEGORY_IDS, CategoryId } from '@amiva/core';
import { CATEGORY_LABELS, motion, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { CategoryIcon } from './icons/CategoryIcon';

interface CategoryIconFilterProps {
  /** undefined = no category filter (all). */
  value: CategoryId | undefined;
  onChange: (next: CategoryId | undefined) => void;
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
        {CATEGORY_IDS.map((cat) => (
          <Chip
            key={cat}
            category={cat}
            selected={value === cat}
            onPress={() => onChange(value === cat ? undefined : cat)}
          />
        ))}
      </View>
      <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>
        {value ? CATEGORY_LABELS[value] : 'All categories'}
      </Text>
    </View>
  );
}

/** One category glyph. Everything animates on the UI thread so the tap
 * reads as instant regardless of any re-render that follows: the fill /
 * border cross-fade to the category hue, the chip pops on select, and it
 * scales down while held. */
function Chip({
  category,
  selected,
  onPress,
}: {
  category: CategoryId;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const hue = t.category(category);

  const press = useSharedValue(0);
  const sel = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    sel.value = reduceMotion ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected, reduceMotion, sel]);

  const chipStyle = useAnimatedStyle(() => {
    const scale = reduceMotion ? 1 : (1 - press.value * 0.12) * (1 + sel.value * 0.05);
    return {
      transform: [{ scale }],
      backgroundColor: interpolateColor(sel.value, [0, 1], [t.colors.surface, hue]),
      borderColor: interpolateColor(sel.value, [0, 1], [t.colors.border, hue]),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = reduceMotion ? 1 : withTiming(1, { duration: 55 });
      }}
      onPressOut={() => {
        press.value = reduceMotion ? 0 : withSpring(0, motion.press);
      }}
      accessibilityRole="button"
      accessibilityLabel={CATEGORY_LABELS[category]}
      accessibilityState={{ selected }}
      style={{ flex: 1, aspectRatio: 1 }}
    >
      <Animated.View
        style={[
          { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
          chipStyle,
        ]}
      >
        <CategoryIcon category={category} size={17} color={selected ? t.colors.textOnAccent : hue} />
      </Animated.View>
    </Pressable>
  );
}
