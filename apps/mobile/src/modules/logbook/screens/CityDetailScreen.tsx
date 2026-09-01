import { FlatList, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { spacing, useTheme } from '../../../theme';
import { ExperienceRow } from '../components/ExperienceRow';
import { useCityExperiences } from '../hooks/useExperiences';

interface CityDetailScreenProps {
  route: { params: { country: string; city: string } };
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function CityDetailScreen({ route, navigation }: CityDetailScreenProps) {
  const t = useTheme();
  const { country, city } = route.params;
  const { profile } = useCurrentUser();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();
  const { data: experiences = [] } = useCityExperiences(profile?.uid, country, city);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.xs }}>
        <Text style={t.type.displayMd}>{city}</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>{country}</Text>
      </View>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg + tabInset, gap: spacing.sm }}
        data={experiences}
        keyExtractor={(item) => item.experienceId}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={<BrandEmptyState title="No experiences here yet" body={`Log something from ${city}.`} />}
        renderItem={({ item }) => (
          <ExperienceRow
            experience={item}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
            subtitle={`${'★'.repeat(item.rating)} · ${item.date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`}
          />
        )}
      />
    </ScreenContainer>
  );
}
