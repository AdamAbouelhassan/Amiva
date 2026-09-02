/**
 * Raw brand palette — the literal hex values from the UI overhaul brief §1.1.
 * Nothing in the app imports these directly; they are assembled into
 * semantic light/dark themes in `themes.ts` and consumed via `useTheme()`.
 *
 * The identity is a set of overlapping colour "lenses" (teal, deep green,
 * coral, amber) converging into one mark — which mirrors the product idea
 * that a travel style is the *overlap* of several dimensions. Keep colour
 * use meaningful: every instance maps to a category, a pillar, or a state.
 */
export const palette = {
  teal: '#3EC6B0', // primary brand accent
  tealDeep: '#1F8F82', // secondary brand accent
  coral: '#ED6A4C', // primary warm CTA
  amber: '#EE9A3D', // secondary warm CTA

  ink: '#26313F', // primary text / dark surfaces
  inkSoft: '#5B6672', // secondary text
  cream: '#FBF8F0', // primary light background
  sky: '#D9F0FD', // tinted background / info
  surfaceDark: '#1B222C', // dark-mode base

  white: '#FFFFFF',
} as const;

/**
 * The 19 travel-style category hues — the SINGLE source for category
 * colour anywhere the categories appear (radar axes, sliders, chips,
 * notification icons). Keyed by CategoryId (`@amiva/core`).
 *
 * PLACEHOLDER PALETTE (taxonomy migration, 2026-09-02): the pre-migration
 * 8-color set was hand-picked to match the brand identity (see `palette`
 * above — teal/coral/amber "lenses"). Generating 19 *hand-tuned,
 * brand-coherent* colors isn't something to improvise unilaterally — this
 * is instead a systematic HSL hue rotation (evenly spaced around the
 * wheel, fixed saturation/lightness per variant), which keeps every
 * category visually distinct and keeps the app compiling/usable, but is
 * explicitly a placeholder pending a real design pass, same treatment the
 * migration prompt itself calls for on TravelStyleRadar's 19-spoke
 * clutter problem. Don't treat these hex values as a design decision.
 */
export const categoryHues = {
  culture: '#CF8F59', // hue 25
  entertainment_and_recreation: '#CFC959', // hue 57
  food_and_drink: '#8ACF59', // hue 95
  health_and_wellness: '#59CF98', // hue 152
  lodging: '#59BDCF', // hue 189
  natural_features: '#5973CF', // hue 227
  places_of_worship: '#8A59CF', // hue 265
  shopping: '#CF59C9', // hue 303
  sports: '#CF5980', // hue 340
} as const;

/**
 * Category hues darkened for use as TEXT on a light ground — same
 * placeholder-palette caveat as `categoryHues` above, generated at a
 * lower lightness/saturation so it reads reasonably on cream/white; not
 * independently WCAG-contrast-verified per swatch the way the
 * pre-migration hand-picked set was.
 */
export const categoryHuesText = {
  culture: '#7E5530',
  entertainment_and_recreation: '#7E7A30',
  food_and_drink: '#507E30',
  health_and_wellness: '#307E59',
  lodging: '#30727E',
  natural_features: '#30417E',
  places_of_worship: '#50307E',
  shopping: '#7E307A',
  sports: '#7E304C',
} as const;

/** Same set, lifted lightness/chroma so fills stay visible on
 * `surfaceDark` — also doubles as dark-mode TEXT colour (see
 * `categoryTextColor` in themes.ts). Same placeholder-palette caveat. */
export const categoryHuesDark = {
  culture: '#DEAE7C',
  entertainment_and_recreation: '#DED97C',
  food_and_drink: '#A5DE7C',
  health_and_wellness: '#7CDEB1',
  lodging: '#7CD0DE',
  natural_features: '#7C92DE',
  places_of_worship: '#A57CDE',
  shopping: '#DE7CD9',
  sports: '#DE7C9F',
} as const;
