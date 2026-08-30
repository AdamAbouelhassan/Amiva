import { Image, View } from 'react-native';
import { colors } from '../theme';

interface AvatarProps {
  uri?: string | null;
  /** Diameter in px. */
  size?: number;
}

/** Circular profile photo with a neutral placeholder when there's no
 * photo. Shared across the account and social modules — anywhere a user
 * is shown (own profile, contact matches, friends). */
export function Avatar({ uri, size = 40 }: AvatarProps) {
  const shape = { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceAlt };
  return uri ? <Image source={{ uri }} style={shape} /> : <View style={shape} />;
}
