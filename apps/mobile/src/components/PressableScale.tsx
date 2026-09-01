/**
 * A `Pressable` that dips + scales down while held and springs back on
 * release (UI thread, `motion.press`) — the standard "yes, you tapped
 * this" feedback for whole cards / rows that don't otherwise react.
 * Reduce-Motion safe.
 */
import { PropsWithChildren } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { motion } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps
  extends Pick<
    PressableProps,
    'onPress' | 'onLongPress' | 'disabled' | 'hitSlop' | 'accessibilityRole' | 'accessibilityLabel'
  > {
  style?: StyleProp<ViewStyle>;
  /** How far it scales while held (default 0.97). */
  scaleTo?: number;
}

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...pressable
}: PropsWithChildren<PressableScaleProps>) {
  const reduceMotion = useReducedMotion();
  const held = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: held.value ? 0.7 : 1 };
    return {
      transform: [{ scale: 1 - held.value * (1 - scaleTo) }],
      opacity: 1 - held.value * 0.12,
    };
  });

  return (
    <AnimatedPressable
      {...pressable}
      // Small delay so tapping a nested control (an icon on the card) claims
      // the gesture first and the whole card doesn't blip.
      unstable_pressDelay={70}
      onPressIn={() => {
        held.value = reduceMotion ? 1 : withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        held.value = reduceMotion ? 0 : withSpring(0, motion.press);
      }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
