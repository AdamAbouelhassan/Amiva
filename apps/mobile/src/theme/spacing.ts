/** Spacing scale — generous whitespace per the brief (§1.3), given how much
 * matrix/stat data the app shows. Theme-independent, so it's a plain
 * static export as well as being on the `useTheme()` object. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  /** Base screen padding (brief §1.3). */
  screen: 20,
} as const;

/** Corner radius — the app-icon squircle is the brand signature, so this
 * stays consistent per role instead of drifting per component (brief §1.3). */
export const radius = {
  chip: 14,
  button: 14,
  card: 20,
  sheet: 20,
  pill: 999,
  // legacy aliases (pre-overhaul call sites) — map onto the role scale
  sm: 14,
  md: 14,
  lg: 20,
} as const;

/** Soft, warm elevation — never pure black (brief §1.3). Spread as
 * `...shadow.resting` onto a View style. */
export const shadow = {
  resting: {
    shadowColor: '#26313F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  pressed: {
    shadowColor: '#26313F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
