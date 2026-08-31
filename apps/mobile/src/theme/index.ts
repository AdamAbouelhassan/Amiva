/**
 * Theme entry point. Components import `useTheme` (colours + type, theme-
 * aware) plus the static, theme-independent scales (`spacing`, `radius`,
 * `shadow`) from here. No component should import raw `tokens` or the
 * light/dark objects directly.
 */
export { ThemeProvider, useTheme } from './ThemeProvider';
export type { Theme, ThemeMode } from './ThemeProvider';

export { spacing, radius, shadow } from './spacing';
export type { SpacingToken, RadiusToken } from './spacing';

export { CATEGORY_LABELS, RADAR_AXIS_ORDER, categoryColor } from './categoryColors';
export type { ThemeColors } from './themes';
export { fonts } from './typography';
