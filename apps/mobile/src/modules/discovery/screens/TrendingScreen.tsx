import { FlatList, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { spacing, useTheme } from '../../../theme';
import { FeedItemCard } from '../components/FeedItemCard';
import { useTrending } from '../hooks/useTrending';

interface TrendingScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function TrendingScreen({ navigation }: TrendingScreenProps) {
  const t = useTheme();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();
  const { items, isLoading, error } = useTrending();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xs }}>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          Most-saved experiences across Amiva
        </Text>
        {error && <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{error}</Text>}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.xs, paddingBottom: spacing.screen + tabInset, gap: spacing.md }}
        data={items}
        keyExtractor={(item) => item.experienceId}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          !isLoading && !error ? (
            <BrandEmptyState
              title="Nothing trending yet"
              body="As people log and save experiences across Amiva, the most popular ones show up here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <FeedItemCard
            experienceId={item.experienceId}
            matchScore={item.matchScore}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
          />
        )}
      />
    </ScreenContainer>
  );
}
