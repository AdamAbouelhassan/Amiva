import { TextStyle } from 'react-native';
import { colors } from './colors';

/** Clean sans-serif, clear hierarchy (style guide). Uses the platform
 * system font — no custom font loading needed for MVP. */
const fontFamily = undefined; // system default

type TypeScale = Record<
  'displayLg' | 'displayMd' | 'title' | 'subtitle' | 'body' | 'bodySmall' | 'caption' | 'statNumber',
  TextStyle
>;

export const typography: TypeScale = {
  displayLg: { fontFamily, fontSize: 32, fontWeight: '700', color: colors.textPrimary, lineHeight: 38 },
  displayMd: { fontFamily, fontSize: 24, fontWeight: '700', color: colors.textPrimary, lineHeight: 30 },
  title: { fontFamily, fontSize: 20, fontWeight: '600', color: colors.textPrimary, lineHeight: 26 },
  subtitle: { fontFamily, fontSize: 16, fontWeight: '600', color: colors.textPrimary, lineHeight: 22 },
  body: { fontFamily, fontSize: 15, fontWeight: '400', color: colors.textPrimary, lineHeight: 21 },
  bodySmall: { fontFamily, fontSize: 13, fontWeight: '400', color: colors.textSecondary, lineHeight: 18 },
  caption: { fontFamily, fontSize: 11, fontWeight: '500', color: colors.textSecondary, lineHeight: 15 },
  // Used for match %/compatibility % displays — visually distinct, accented.
  statNumber: { fontFamily, fontSize: 28, fontWeight: '700', color: colors.accent, lineHeight: 32 },
};
