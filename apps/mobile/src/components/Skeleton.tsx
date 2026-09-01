/**
 * The one loading placeholder — a `surfaceAlt` block that gently pulses
 * (opacity loop, gated by Reduce Motion). Compose these into the shape of
 * whatever's loading. `AppImage`'s built-in skeleton uses this too.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { radius as radii, useTheme } from '../theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  /** Set false to hold a steady placeholder (e.g. a permanent no-image slot). */
  pulse?: boolean;
}

export function Skeleton({ style, pulse = true }: SkeletonProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0.55)).current;
  const animate = pulse && !reduceMotion;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, anim]);

  const base = useMemo<ViewStyle>(
    () => ({ backgroundColor: t.colors.surfaceAlt, borderRadius: radii.chip }),
    [t.colors.surfaceAlt],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[base, style, animate ? { opacity: anim } : { opacity: 0.7 }]}
    />
  );
}

/** An absolute-fill skeleton with a matched corner radius — used by `AppImage`. */
export function SkeletonFill({ borderRadius = 0, pulse }: { borderRadius?: number; pulse?: boolean }) {
  return <Skeleton pulse={pulse} style={[StyleSheet.absoluteFill, { borderRadius }]} />;
}
