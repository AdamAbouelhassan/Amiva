import { TextStyle } from 'react-native';
import type { ThemeColors } from './themes';

/**
 * Type system (brief §1.2): a rounded geometric sans (**Baloo 2**) for
 * display/headings/the match numerals — personality, only ever at ≥22pt —
 * and **Inter** for all body/UI text. Scale: 34 / 28 / 22 / 17 / 15 / 13.
 *
 * Weight comes from picking the family *variant*, never `fontWeight` on a
 * single word (brief §1.2). Colour is baked per-theme, so this is a factory.
 */
export const fonts = {
  displayBold: 'Baloo2_700Bold',
  displaySemi: 'Baloo2_600SemiBold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Every font face this app loads (see App.tsx `useFonts`). */
export { useFonts } from '@expo-google-fonts/inter';
export {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
export { Baloo2_600SemiBold, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';

export type TypeScale = Record<
  | 'displayLg'
  | 'displayMd'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'statNumber',
  TextStyle
>;

export function makeType(c: ThemeColors): TypeScale {
  return {
    displayLg: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, color: c.textPrimary },
    displayMd: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 34, color: c.textPrimary },
    title: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28, color: c.textPrimary },
    subtitle: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 24, color: c.textPrimary },
    body: { fontFamily: fonts.bodyRegular, fontSize: 15, lineHeight: 22, color: c.textPrimary },
    bodySmall: { fontFamily: fonts.bodyRegular, fontSize: 13, lineHeight: 19, color: c.textSecondary },
    caption: {
      fontFamily: fonts.bodySemi,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.3,
      color: c.textSecondary,
    },
    label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: c.textSecondary },
    // Match %, compatibility %, Logbook stat counts — the display face, accented.
    statNumber: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: c.accent },
  };
}
