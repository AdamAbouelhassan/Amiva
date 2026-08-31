/**
 * Raw brand palette — the literal hex values from the UI overhaul brief §1.1.
 * Nothing in the app imports these directly; they are assembled into
 * semantic light/dark themes in `themes.ts` and consumed via `useTheme()`.
 *
 * The identity is a set of overlapping colour "lenses" (teal, deep green,
 * coral, amber) converging into one mark — which mirrors the product idea
 * that a travel style is the *overlap* of 8 dimensions. Keep colour use
 * meaningful: every instance maps to a category, a pillar, or a state.
 */
export const palette = {
  teal: '#3EC6B0', // Adventure axis · primary brand accent
  tealDeep: '#1F8F82', // Nature axis · secondary brand accent
  coral: '#ED6A4C', // Social/Nightlife axis · primary warm CTA
  amber: '#EE9A3D', // Foodie axis · secondary warm CTA

  ink: '#26313F', // primary text / dark surfaces
  inkSoft: '#5B6672', // secondary text
  cream: '#FBF8F0', // primary light background
  sky: '#D9F0FD', // tinted background / info
  surfaceDark: '#1B222C', // dark-mode base

  white: '#FFFFFF',
} as const;

/**
 * The 8 travel-style category hues — the SINGLE source for category colour
 * anywhere the categories appear (radar axes, onboarding sliders, chips,
 * notification icons). Keyed by the canonical category id from
 * `@amiva/core`. `*_DARK` lifts lightness/chroma so fills stay visible on
 * `surfaceDark`.
 */
export const categoryHues = {
  adventure: '#3EC6B0',
  culture: '#C65A46',
  foodie: '#EE9A3D',
  socialNightlife: '#ED6A4C',
  budgetBackpacker: '#C97F2E',
  relaxation: '#5FA8D4',
  nature: '#1F8F82',
  luxury: '#8B6F9E',
} as const;

/**
 * Category hues darkened for use as TEXT on a light ground — the raw
 * `categoryHues` are light mint/gold and fail WCAG AA as small text on
 * cream/white. Each of these clears 4.5:1 on both. In dark mode
 * `categoryHuesDark` already clears it, so it doubles as the text colour.
 */
export const categoryHuesText = {
  adventure: '#327975',
  culture: '#AC5345',
  foodie: '#8E683E',
  socialNightlife: '#A55547',
  budgetBackpacker: '#8E6334',
  relaxation: '#467492',
  nature: '#207C75',
  luxury: '#7B658F',
} as const;

export const categoryHuesDark = {
  adventure: '#4FD8C1',
  culture: '#E07761',
  foodie: '#F2A857',
  socialNightlife: '#F2785C',
  budgetBackpacker: '#DB9848',
  relaxation: '#7CBEE4',
  nature: '#2FB0A0',
  luxury: '#A98CBE',
} as const;
