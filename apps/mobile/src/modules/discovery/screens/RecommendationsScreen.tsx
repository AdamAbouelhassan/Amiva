import { FlatList, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { spacing, typography } from '../../../theme';
import { FeedItemCard } from '../components/FeedItemCard';
import { useRecommendations } from '../hooks/useRecommendations';

interface RecommendationsScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function RecommendationsScreen({ navigation }: RecommendationsScreenProps) {
  const { results, isLoading, locationFilter, setLocationFilter } = useRecommendations();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text style={typography.displayMd}>For you</Text>
        <TextField label="Location" value={locationFilter} onChangeText={setLocationFilter} placeholder="Filter by city or country" />
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        data={results}
        keyExtractor={(item) => item.experience.experienceId}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <FeedItemCard
            item={{ experience: item.experience, isFriend: false, matchScore: item.matchScore, createdAt: item.experience.createdAt }}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experience.experienceId })}
          />
        )}
      />
    </ScreenContainer>
  );
}
