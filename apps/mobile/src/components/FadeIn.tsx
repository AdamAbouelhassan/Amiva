/**
 * Fades its children in on mount (opacity 0→1 on the UI thread). A plain,
 * dependency-light alternative to Reanimated's `entering={FadeIn}` layout
 * animation — remount it (change its `key`) to replay. Reduce-Motion safe.
 */
import { PropsWithChildren, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from '../theme';

interface FadeInProps {
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export function FadeIn({ children, style, duration = motion.fadeIn }: PropsWithChildren<FadeInProps>) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    opacity.value = reduceMotion ? 1 : withTiming(1, { duration });
  }, [reduceMotion, duration, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
