/**
 * Shared animation configs — one source so every selection indicator and
 * every press feels identical (the segmented pill, the tab-bar bubble,
 * chip / icon-button taps). Tuned snappy: fast settle, minimal overshoot,
 * so a tap reads as instant.
 */
export const motion = {
  /** Indicators that slide between positions (segmented pill, tab bubble). */
  slide: { damping: 20, stiffness: 320, mass: 0.6 },
  /** Press-in / release pop for buttons and chips. */
  press: { damping: 13, stiffness: 430, mass: 0.5 },
  /** How far a Pressable scales down while held. */
  pressScale: 0.9,
  /** Cross-fade durations, ms. */
  fadeIn: 120,
  fadeOut: 90,
} as const;
