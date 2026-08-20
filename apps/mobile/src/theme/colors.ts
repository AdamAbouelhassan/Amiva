/**
 * CLAUDE.md Style Guide: "Warm neutral base (off-white/sand backgrounds,
 * charcoal text) with a single vibrant accent color (coral or teal — pick
 * one and apply consistently)." Teal chosen as the one accent, used for
 * match-score percentages, radar chart fills, primary CTAs, and active
 * nav states — nowhere else.
 */
export const colors = {
  // Warm neutral base
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F1ECE3',
  border: '#E4DDCF',

  textPrimary: '#2B2622', // charcoal
  textSecondary: '#6E655A',
  textOnAccent: '#FFFFFF',

  // The one accent color
  accent: '#0F9B8E',
  accentMuted: '#DCF1EE',
  accentPressed: '#0C7C72',

  // Semantic (kept minimal — not additional competing accents)
  success: '#3E8E5A',
  danger: '#C1483A',
  warning: '#C98A2C',

  overlay: 'rgba(43, 38, 34, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
