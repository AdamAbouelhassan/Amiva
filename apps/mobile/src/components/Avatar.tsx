import { Text, View } from 'react-native';
import { AppImage } from './AppImage';
import { useTheme } from '../theme';

interface AvatarProps {
  uri?: string | null;
  /** Diameter in px. */
  size?: number;
  /** Shown as an initial when there's no photo. */
  name?: string;
}

/** Circular profile photo with a neutral placeholder when there's no
 * photo. Shared across the account and social modules — anywhere a user
 * is shown (own profile, contact matches, friends). */
export function Avatar({ uri, size = 40, name }: AvatarProps) {
  const t = useTheme();
  const shape = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: t.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: t.colors.border,
  };

  if (uri) return <AppImage uri={uri} style={shape} />;

  const initial = name?.trim()?.[0]?.toUpperCase();
  return (
    <View style={[shape, { alignItems: 'center', justifyContent: 'center' }]}>
      {initial ? (
        <Text
          style={{
            fontFamily: t.type.title.fontFamily,
            fontSize: size * 0.4,
            color: t.colors.textSecondary,
          }}
        >
          {initial}
        </Text>
      ) : null}
    </View>
  );
}
