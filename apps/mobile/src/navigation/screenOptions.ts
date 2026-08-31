import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme';

/** Themed native-stack header options — one source so every module's
 * navigator has an identical, brand-consistent header (Baloo 2 titles,
 * themed tint, no hairline on the cream ground). */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const t = useTheme();
  return {
    headerStyle: { backgroundColor: t.colors.background },
    headerShadowVisible: false,
    headerTintColor: t.colors.accent,
    headerTitleStyle: { fontFamily: fonts.displaySemi, fontSize: 18, color: t.colors.textPrimary },
    headerBackTitleVisible: false,
    contentStyle: { backgroundColor: t.colors.background },
  } as NativeStackNavigationOptions;
}
