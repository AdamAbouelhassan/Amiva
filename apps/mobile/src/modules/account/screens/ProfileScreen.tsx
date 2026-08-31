import { View } from 'react-native';
import { topCategories } from '@amiva/core';
import { Card } from '../../../components/Card';
import { CategoryChip } from '../../../components/CategoryChip';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar, TravelStyleValueList } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { spacing } from '../../../theme';

export function ProfileScreen() {
  const { profile } = useCurrentUser();
  const refresh = useRefresh();
  if (!profile) return null;

  const top3 = topCategories(profile.travelStyle);

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
      <ProfileIdentity
        layout="stacked"
        name={profile.name}
        username={profile.username}
        photoUrl={profile.profilePhotoUrl}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
        {top3.map((category) => (
          <CategoryChip key={category} category={category} selected />
        ))}
      </View>

      <View style={{ alignItems: 'center' }}>
        <TravelStyleRadar series={[{ vector: profile.travelStyle }]} highlightTop size={280} />
      </View>

      <Card padded>
        <TravelStyleValueList vector={profile.travelStyle} />
      </Card>
    </ScreenContainer>
  );
}
