import { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { radius, shadow, spacing, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

const PAD = 3;
const GAP = 3;

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** A pill-track segmented control whose selection indicator glides between
 * segments with a spring. The indicator is a solid rounded surface that
 * sits concentrically inside the track. */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const [trackW, setTrackW] = useState(0);

  const n = options.length;
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const segW = trackW > 0 ? (trackW - PAD * 2 - GAP * (n - 1)) / n : 0;
  const pillRadius = radius.chip - PAD;

  const indicatorStyle = useAnimatedStyle(() => {
    const x = activeIndex * (segW + GAP);
    return {
      width: segW,
      opacity: segW > 0 ? 1 : 0,
      transform: [
        { translateX: reduceMotion ? x : withSpring(x, { damping: 18, stiffness: 210, mass: 0.7 }) },
      ],
    };
  }, [activeIndex, segW, reduceMotion]);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: t.colors.surfaceAlt,
        borderRadius: radius.chip,
        padding: PAD,
        gap: GAP,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: PAD,
            top: PAD,
            bottom: PAD,
            borderRadius: pillRadius,
            backgroundColor: t.colors.surface,
          },
          shadow.resting,
          indicatorStyle,
        ]}
      />

      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}
          >
            <Text style={[t.type.label, { color: active ? t.colors.textPrimary : t.colors.textSecondary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
