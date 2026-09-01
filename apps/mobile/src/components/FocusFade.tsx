/**
 * Wraps a bottom-tab screen so it fades + rises into place each time the
 * tab is focused (react-navigation v6 bottom-tabs swap instantly — this is
 * the smooth transition). It stays put on blur since the screen is covered
 * anyway, which avoids a flash on the way out.
 */
import { PropsWithChildren, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function FocusFade({ children }: PropsWithChildren) {
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (!focused) return;
    p.value = reduceMotion
      ? withTiming(1, { duration: 90 })
      : withSpring(1, { damping: 20, stiffness: 180, mass: 0.7 });
  }, [focused, reduceMotion, p]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: reduceMotion ? [] : [{ translateY: (1 - p.value) * 10 }],
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}
