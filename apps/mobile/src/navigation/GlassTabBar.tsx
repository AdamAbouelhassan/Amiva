/**
 * Custom bottom tab bar with an Apple-style sliding selection bubble. On
 * iOS 26 the bar is real Liquid Glass (`GlassSurface`) and the bubble is a
 * tinted glass lens; elsewhere both fall back to solid surfaces. The
 * bubble springs to the active tab on every switch (same spring as the
 * in-page `SegmentedControl` pill) and the active icon lifts + scales.
 *
 * It reports its own height through `BottomTabBarHeightCallbackContext` so
 * `useTabBarInset()` keeps padding scroll content correctly (the bar is
 * `position:'absolute'` and floats over content).
 */
import { useContext, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import {
  BottomTabBarHeightCallbackContext,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { GlassSurface, LIQUID_GLASS } from '../components/GlassSurface';
import { NavIcon, NavIconName } from '../components/icons/NavIcon';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion, useTheme } from '../theme';

// Short bar, big icons (Facebook-style).
const BAR_H = 42;
const TAB_H = 56;
const BUBBLE_H = 38;
const ICON = 30;
const PAD_X = 6;
// `motion.slide` — the exact spring the SegmentedControl pill uses.
const SPRING = motion.slide;

export function GlassTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const t = useTheme();
  const reduceMotion = useReducedMotion();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const [barW, setBarW] = useState(0);

  const n = state.routes.length;
  const slotW = barW > 0 ? (barW - PAD_X * 2) / n : 0;
  const bubbleW = slotW > 0 ? Math.min(slotW - 14, 64) : 0;

  const bubbleStyle = useAnimatedStyle(() => {
    const x = PAD_X + state.index * slotW + (slotW - bubbleW) / 2;
    return {
      width: bubbleW,
      opacity: bubbleW > 0 ? 1 : 0,
      transform: [{ translateX: reduceMotion ? x : withSpring(x, SPRING) }],
    };
  }, [state.index, slotW, bubbleW, reduceMotion]);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        setBarW(e.nativeEvent.layout.width);
        reportHeight?.(e.nativeEvent.layout.height);
      }}
      style={[
        styles.bar,
        {
          height: BAR_H + insets.bottom,
          paddingBottom: insets.bottom,
          paddingHorizontal: PAD_X,
          backgroundColor: LIQUID_GLASS ? 'transparent' : t.colors.surface,
          borderTopWidth: LIQUID_GLASS ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: t.colors.border,
        },
      ]}
    >
      {LIQUID_GLASS ? <GlassSurface style={StyleSheet.absoluteFill} /> : null}

      <Animated.View
        pointerEvents="none"
        style={[styles.bubble, { height: BUBBLE_H, top: (BAR_H - BUBBLE_H) / 2, borderRadius: BUBBLE_H / 2 }, bubbleStyle]}
      >
        {LIQUID_GLASS ? (
          <GlassView
            style={[StyleSheet.absoluteFill, { borderRadius: BUBBLE_H / 2 }]}
            glassEffectStyle="regular"
            tintColor={t.colors.accentMuted}
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { borderRadius: BUBBLE_H / 2, backgroundColor: t.colors.accentMuted }]}
          />
        )}
      </Animated.View>

      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate({ key: route.key, name: route.name, params: route.params } as never);
          }
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options?.tabBarAccessibilityLabel ?? route.name}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.tab}
          >
            <TabBarIcon
              name={route.name as NavIconName}
              focused={focused}
              color={focused ? t.colors.accent : t.colors.textSecondary}
              reduceMotion={reduceMotion}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function TabBarIcon({
  name,
  focused,
  color,
  reduceMotion,
}: {
  name: NavIconName;
  focused: boolean;
  color: string;
  reduceMotion: boolean;
}) {
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = reduceMotion ? (focused ? 1 : 0) : withSpring(focused ? 1 : 0, SPRING);
  }, [focused, reduceMotion, p]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.08 }, { translateY: -p.value * 1.5 }],
  }));
  return (
    <Animated.View style={style}>
      <NavIcon name={name} focused={focused} size={ICON} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: (BAR_H - TAB_H) / 2,
  },
  tab: { flex: 1, height: TAB_H, alignItems: 'center', justifyContent: 'center' },
  bubble: { position: 'absolute', left: 0, overflow: 'hidden' },
});
