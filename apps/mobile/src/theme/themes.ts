/**
 * Semantic theme objects. Components never touch raw `palette` — they read
 * these keys through `useTheme()`. Dark is hand-tuned, not an inversion:
 * every translucent overlap and every text-on-colour pairing was
 * re-checked against `surfaceDark` (see the QA notes in the overhaul plan).
 *
 * Text-on-brand-colour rule: the brand teal/amber are light mint/gold, so
 * white text on them fails WCAG AA. `textOnAccent` is therefore dark ink in
 * BOTH themes — primary buttons put ink on the bright fill, not white.
 */
import { categoryHues, categoryHuesDark, categoryHuesText, palette } from './tokens';
import type { TravelStyleCategory } from '@amiva/core';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceInverse: string;
  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textOnAccent: string;
  textInverse: string;

  accent: string;
  accentPressed: string;
  accentMuted: string;
  /** Coral fill — buttons, dots, borders (ink text clears AA on it). */
  accentWarm: string;
  /** Coral tuned for use as TEXT on the theme's surfaces (WCAG AA). */
  accentWarmText: string;
  accentWarmPressed: string;
  accentWarmMuted: string;

  info: string;
  infoText: string;
  success: string;
  danger: string;
  /** Faint danger tint — background for destructive icon buttons / chips. */
  dangerMuted: string;
  warning: string;

  overlay: string;
  /** Legible glyph/text colour on top of `overlay` / a photo scrim — white
   * in both themes. */
  onScrim: string;

  /** 4 core hues for the radar polygon gradient — the "overlapping lens" echo. */
  radarGradient: [string, string, string, string];
  radarGrid: string;
  radarCompare: string;

  /** Match-%-badge fill ramp, warm (low) → cool (high). Tuned so
   * `textOnAccent` clears WCAG AA on every stop, both themes. */
  matchRamp: [string, string, string, string];
}

export const lightColors: ThemeColors = {
  background: palette.cream,
  surface: palette.white,
  surfaceAlt: '#F3EEE1',
  surfaceInverse: palette.ink,
  border: '#E7DFCE',
  borderStrong: '#D8CDB6',

  textPrimary: palette.ink,
  textSecondary: palette.inkSoft,
  textOnAccent: palette.ink,
  textInverse: palette.cream,

  accent: palette.teal,
  accentPressed: '#2FA894',
  accentMuted: '#DCF3EF',
  accentWarm: '#EF795E',
  accentWarmText: '#A55547',
  accentWarmPressed: '#D9573A',
  accentWarmMuted: '#FBE3DC',

  info: palette.sky,
  infoText: '#2C6C8C',
  success: '#3E8E5A',
  danger: '#C1483A',
  dangerMuted: '#F6E1DE',
  warning: palette.amber,

  overlay: 'rgba(38,49,63,0.45)',
  onScrim: '#FFFFFF',

  radarGradient: [palette.teal, palette.tealDeep, palette.amber, palette.coral],
  radarGrid: '#E7DFCE',
  radarCompare: palette.inkSoft,
  matchRamp: ['#F2A991', '#F3B872', '#7ED9C7', '#43C9B4'],
};

export const darkColors: ThemeColors = {
  background: '#141A21',
  surface: '#1F2831',
  surfaceAlt: '#2A343F',
  surfaceInverse: palette.cream,
  border: '#333E4A',
  borderStrong: '#45525F',

  textPrimary: '#ECEEF1',
  textSecondary: '#9BA6B2',
  textOnAccent: '#12201D',
  textInverse: palette.ink,

  accent: '#45D4BE',
  accentPressed: '#63E0CD',
  accentMuted: '#21403B',
  accentWarm: '#F27A5D',
  accentWarmText: '#F58C73',
  accentWarmPressed: '#F59178',
  accentWarmMuted: '#3E2A24',

  info: '#22384A',
  infoText: '#9BD3EE',
  success: '#5BB07C',
  danger: '#E27567',
  dangerMuted: '#3B2422',
  warning: '#F2A857',

  overlay: 'rgba(0,0,0,0.6)',
  onScrim: '#FFFFFF',

  radarGradient: ['#45D4BE', '#2AA594', '#F2A857', '#F2785C'],
  radarGrid: '#333E4A',
  radarCompare: '#9BA6B2',
  matchRamp: ['#F2A991', '#F3B872', '#7ED9C7', '#43C9B4'],
};

/** Category hue for fills / icons / radar polygon (large areas & graphics). */
export function categoryColor(category: TravelStyleCategory, isDark: boolean): string {
  return (isDark ? categoryHuesDark : categoryHues)[category];
}

/** Category hue safe as small TEXT on the theme's surfaces (WCAG AA). */
export function categoryTextColor(category: TravelStyleCategory, isDark: boolean): string {
  return (isDark ? categoryHuesDark : categoryHuesText)[category];
}
