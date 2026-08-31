import { Image, ImageStyle, StyleProp } from 'react-native';

const SOURCE = require('../../../assets/brand/amiva-mark-gradient.png');

interface BrandMarkProps {
  size?: number;
  /** Dim it for use as a watermark behind empty-state copy. */
  opacity?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * The Amiva glyph (triangle + dot + paper plane) — used for in-app
 * branding: nav headers, loading marks, onboarding, and faded large as an
 * empty-state watermark (brief §0, §3.2).
 *
 * NOTE: the source file is currently a flattened raster with a paper-
 * texture background (not transparent). The user replaces it with a
 * cleaned, transparent version at the SAME path later — this component
 * needs no change when that happens. Don't scale it past ~2× the native
 * 597px until then. `resizeMode='contain'` so a swapped-in aspect ratio
 * still fits.
 */
export function BrandMark({ size = 40, opacity = 1, style }: BrandMarkProps) {
  return (
    <Image
      source={SOURCE}
      resizeMode="contain"
      style={[{ width: size, height: size, opacity }, style]}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}
