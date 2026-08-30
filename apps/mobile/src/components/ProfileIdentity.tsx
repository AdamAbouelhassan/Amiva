import { Text, View } from 'react-native';
import { spacing, typography } from '../theme';
import { Avatar } from './Avatar';

interface ProfileIdentityProps {
  name: string;
  username?: string;
  photoUrl?: string | null;
  /**
   * 'row' (default): avatar beside a name / @username stack — for list
   * rows. 'stacked': centered column with a larger avatar — for the
   * header of a screen that is about one person.
   */
  layout?: 'row' | 'stacked';
  avatarSize?: number;
}

/** The one way a user is shown anywhere in the app: profile photo, then
 * a bold name with the @username unbolded underneath it. */
export function ProfileIdentity({ name, username, photoUrl, layout = 'row', avatarSize }: ProfileIdentityProps) {
  const stacked = layout === 'stacked';
  const size = avatarSize ?? (stacked ? 96 : 40);
  return (
    <View
      style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? spacing.xs : spacing.sm,
        flexShrink: 1,
      }}
    >
      <Avatar uri={photoUrl} size={size} />
      <View style={{ flexShrink: 1, alignItems: stacked ? 'center' : 'flex-start' }}>
        <Text style={stacked ? typography.displayMd : typography.subtitle} numberOfLines={1}>
          {name}
        </Text>
        {username ? (
          <Text style={typography.bodySmall} numberOfLines={1}>
            @{username}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
