import { Pressable, Text, View } from 'react-native';
import { topCategories } from '@amiva/core';
import { Card } from '../../../components/Card';
import { CategoryChip } from '../../../components/CategoryChip';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar, TravelStyleValueList } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { spacing, useTheme } from '../../../theme';

interface ProfileScreenProps {
  navigation: { navigate: (screen: 'Settings') => void };
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const refresh = useRefresh();
  if (!profile) return null;

  const top3 = topCategories(profile.travelStyle);

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing} safeAreaTop>
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8} accessibilityRole="button">
          <Text style={[t.type.subtitle, { color: t.colors.accent }]}>Settings</Text>
        </Pressable>
      </View>

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
