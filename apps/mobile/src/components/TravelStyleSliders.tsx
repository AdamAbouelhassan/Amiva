/**
 * The 8-category rating sliders — used at account onboarding, in manual
 * travel-style editing (Settings), and when setting an experience's own
 * category profile at posting time (functional_specification.md §2.3,
 * §2.4, §2.5). Each track is tinted with that category's colour (brief
 * §3.1) so the sliders and the radar read as one system.
 */
import Slider from '@react-native-community/slider';
import { Text, View } from 'react-native';
import { CATEGORY_MAX, CATEGORY_MIN, TRAVEL_STYLE_CATEGORIES, TravelStyleVector } from '@amiva/core';
import { CATEGORY_LABELS, spacing, useTheme } from '../theme';
import { CategoryIcon } from './icons/CategoryIcon';

interface TravelStyleSlidersProps {
  value: TravelStyleVector;
  onChange: (next: TravelStyleVector) => void;
  disabled?: boolean;
  /** Render just one category (used by the one-at-a-time onboarding flow). */
  only?: (typeof TRAVEL_STYLE_CATEGORIES)[number];
}

export function TravelStyleSliders({ value, onChange, disabled, only }: TravelStyleSlidersProps) {
  const t = useTheme();
  const categories = only ? [only] : TRAVEL_STYLE_CATEGORIES;

  return (
    <View style={{ gap: spacing.md }}>
      {categories.map((category) => {
        const hue = t.category(category);
        return (
          <View key={category} style={{ gap: spacing.xxs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <CategoryIcon category={category} size={18} color={hue} />
              <Text style={[t.type.body, { flex: 1 }]}>{CATEGORY_LABELS[category]}</Text>
              <Text style={[t.type.subtitle, { color: t.categoryText(category) }]}>
                {value[category].toFixed(0)}
              </Text>
            </View>
            <Slider
              minimumValue={CATEGORY_MIN}
              maximumValue={CATEGORY_MAX}
              step={1}
              value={value[category]}
              disabled={disabled}
              minimumTrackTintColor={hue}
              maximumTrackTintColor={t.colors.border}
              thumbTintColor={hue}
              onValueChange={(next) => onChange({ ...value, [category]: next })}
            />
          </View>
        );
      })}
    </View>
  );
}
