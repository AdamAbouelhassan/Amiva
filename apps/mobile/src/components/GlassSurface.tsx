/**
 * Apple Liquid Glass material. On iOS 26+ (`expo-glass-effect`'s
 * `GlassView` → UIKit `UIGlassEffect`, available in Expo Go on an iOS 26
 * device) this is the real refractive glass; everywhere else it falls back
 * to a plain opaque surface. The branch is decided once at module load by
 * `isLiquidGlassAvailable()`.
 *
 * Used for the bottom tab bar background — the bar is `position:'absolute'`
 * so page content scrolls behind the glass.
 */
import { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTheme } from '../theme';

export const LIQUID_GLASS = isLiquidGlassAvailable();

interface GlassSurfaceProps {
  style?: StyleProp<ViewStyle>;
}

export function GlassSurface({ style, children }: PropsWithChildren<GlassSurfaceProps>) {
  const t = useTheme();

  if (LIQUID_GLASS) {
    return (
      <GlassView style={style} glassEffectStyle="regular">
        {children}
      </GlassView>
    );
  }

  return <View style={[style, { backgroundColor: t.colors.surface }]}>{children}</View>;
}
