import { FlatList, RefreshControl, Text } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { DiscoveryStackParamList } from '../../../navigation/types';
import { spacing, typography } from '../../../theme';
import { FeedItemCard } from '../components/FeedItemCard';
import { useFeed } from '../hooks/useFeed';

interface FeedScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: DiscoveryStackParamList['ExperienceDetail']) => void };
}

export function FeedScreen({ navigation }: FeedScreenProps) {
  const { items, isLoading, refetch } = useFeed();

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        data={items}
        keyExtractor={(item) => item.experience.experienceId}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListHeaderComponent={<Text style={typography.displayMd}>Discover</Text>}
        ListEmptyComponent={!isLoading ? <Text style={typography.body}>Nothing to show yet.</Text> : null}
        renderItem={({ item }) => (
          <FeedItemCard
            item={item}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experience.experienceId })}
          />
        )}
      />
    </ScreenContainer>
  );
}
