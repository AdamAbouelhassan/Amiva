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
  automotive: '#CF5959', // hue 0
  business: '#CF7E59', // hue 19
  culture: '#CFA459', // hue 38
  education: '#CFC959', // hue 57
  entertainment_and_recreation: '#AFCF59', // hue 76
  facilities: '#8ACF59', // hue 95
  finance: '#65CF59', // hue 114
  food_and_drink: '#59CF73', // hue 133
  geographical_areas: '#59CF98', // hue 152
  government: '#59CFBD', // hue 171
  health_and_wellness: '#59BDCF', // hue 189
  housing: '#5998CF', // hue 208
  lodging: '#5973CF', // hue 227
  natural_features: '#6559CF', // hue 246
  places_of_worship: '#8A59CF', // hue 265
  services: '#AF59CF', // hue 284
  shopping: '#CF59C9', // hue 303
  sports: '#CF59A4', // hue 322
  transportation: '#CF597E', // hue 341
} as const;

/**
 * Category hues darkened for use as TEXT on a light ground — same
 * placeholder-palette caveat as `categoryHues` above, generated at a
 * lower lightness/saturation so it reads reasonably on cream/white; not
 * independently WCAG-contrast-verified per swatch the way the
 * pre-migration hand-picked set was.
 */
export const categoryHuesText = {
  automotive: '#7E3030',
  business: '#7E4830',
  culture: '#7E6130',
  education: '#7E7A30',
  entertainment_and_recreation: '#697E30',
  facilities: '#507E30',
  finance: '#377E30',
  food_and_drink: '#307E41',
  geographical_areas: '#307E59',
  government: '#307E72',
  health_and_wellness: '#30727E',
  housing: '#30597E',
  lodging: '#30417E',
  natural_features: '#37307E',
  places_of_worship: '#50307E',
  services: '#69307E',
  shopping: '#7E307A',
  sports: '#7E3061',
  transportation: '#7E3048',
} as const;

/** Same set, lifted lightness/chroma so fills stay visible on
 * `surfaceDark` — also doubles as dark-mode TEXT colour (see
 * `categoryTextColor` in themes.ts). Same placeholder-palette caveat. */
export const categoryHuesDark = {
  automotive: '#DE7C7C',
  business: '#DE9B7C',
  culture: '#DEBA7C',
  education: '#DED97C',
  entertainment_and_recreation: '#C4DE7C',
  facilities: '#A5DE7C',
  finance: '#86DE7C',
  food_and_drink: '#7CDE92',
  geographical_areas: '#7CDEB1',
  government: '#7CDED0',
  health_and_wellness: '#7CD0DE',
  housing: '#7CB1DE',
  lodging: '#7C92DE',
  natural_features: '#867CDE',
  places_of_worship: '#A57CDE',
  services: '#C47CDE',
  shopping: '#DE7CD9',
  sports: '#DE7CBA',
  transportation: '#DE7C9B',
} as const;
