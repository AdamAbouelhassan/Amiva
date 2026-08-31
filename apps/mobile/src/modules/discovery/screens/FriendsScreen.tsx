import { FlatList, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useRefresh } from '../../../hooks/useRefresh';
import { spacing, useTheme } from '../../../theme';
import { ActivityCard } from '../components/ActivityCard';
import { useFriendsActivity } from '../hooks/useFriendsActivity';

interface FriendsScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function FriendsScreen({ navigation }: FriendsScreenProps) {
  const t = useTheme();
  const refresh = useRefresh();
  const { items, isLoading, error } = useFriendsActivity();

  return (
    <ScreenContainer scroll={false}>
      {error ? (
        <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xs }}>
          <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, gap: spacing.lg }}
        data={items}
        keyExtractor={(item) => item.id}
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
              title="No friend activity yet"
              body="When your friends log experiences, plan trips, or save places, it shows up here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            onOpenExperience={(experienceId) => navigation.navigate('ExperienceDetail', { experienceId })}
          />
        )}
      />
    </ScreenContainer>
  );
}
