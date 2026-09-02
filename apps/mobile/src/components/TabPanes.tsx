/**
 * In-page tab bodies that cross-dissolve when the active key changes. Each
 * pane is mounted on first activation and then KEPT mounted (so scroll
 * position, data, and filter state survive tab switches); only opacity /
 * a small x-slide animate.
 */
import { ReactNode, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from '../theme';

interface Pane {
  key: string;
  node: ReactNode;
}

export function TabPanes({ activeKey, panes }: { activeKey: string; panes: Pane[] }) {
  const visited = useRef<Set<string>>(new Set());
  visited.current.add(activeKey);

  const order = useMemo(() => panes.map((p) => p.key), [panes]);
  const activeIndex = order.indexOf(activeKey);

  return (
    <View style={{ flex: 1 }}>
      {panes.map((p) =>
        visited.current.has(p.key) ? (
          <PaneLayer key={p.key} active={p.key === activeKey} delta={order.indexOf(p.key) - activeIndex}>
            {p.node}
          </PaneLayer>
        ) : null,
      )}
    </View>
  );
}

function PaneLayer({ active, delta, children }: { active: boolean; delta: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  const style = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: withTiming(active ? 1 : 0, { duration: 90 }) };
    }
    const x = active ? 0 : delta < 0 ? -8 : 8;
    return {
      opacity: withTiming(active ? 1 : 0, { duration: active ? motion.fadeIn : motion.fadeOut }),
      transform: [{ translateX: withSpring(x, motion.slide) }],
    };
  }, [active, delta, reduceMotion]);

  // The active pane sits above the others (`zIndex`) and is the only one
  // that takes touches. `pointerEvents` goes on a PLAIN inner View — the
  // prop on Reanimated's Animated.View isn't reliably applied on the New
  // Architecture, which left an invisible inactive pane eating taps meant
  // for the active one (Discovery's "Friends" tab, 2026-09).
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: active ? 1 : 0 }, style]}
      pointerEvents={active ? 'auto' : 'none'}
    >
      <View style={{ flex: 1, pointerEvents: active ? 'auto' : 'none' }}>{children}</View>
    </Animated.View>
  );
}
