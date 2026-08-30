import { Text, View } from 'react-native';
import { topCategories } from '@amiva/core';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { RadarChart, TravelStyleValueList } from '../../../components/RadarChart';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { CATEGORY_LABELS, colors, spacing, typography } from '../../../theme';

export function ProfileScreen() {
  const { profile } = useCurrentUser();
  if (!profile) return null;

  const top3 = topCategories(profile.travelStyle);

  return (
    <ScreenContainer>
      <ProfileIdentity
        layout="stacked"
        name={profile.name}
        username={profile.username}
        photoUrl={profile.profilePhotoUrl}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
        {top3.map((category) => (
          <View
            key={category}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
              borderRadius: 999,
              backgroundColor: colors.accentMuted,
            }}
          >
            <Text style={[typography.caption, { color: colors.accent }]}>{CATEGORY_LABELS[category]}</Text>
          </View>
        ))}
      </View>

      <RadarChart series={[{ vector: profile.travelStyle, color: colors.accent }]} />
      <TravelStyleValueList vector={profile.travelStyle} />
    </ScreenContainer>
  );
}
