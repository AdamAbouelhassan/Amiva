import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { CATEGORY_LABELS, colors, spacing, typography } from '../../../theme';
import { DiscoveryStackParamList } from '../../../navigation/types';
import { FeedItemCard } from '../components/FeedItemCard';
import { FeedFilter, useFeed } from '../hooks/useFeed';

interface FeedScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: DiscoveryStackParamList['ExperienceDetail']) => void };
}

export function FeedScreen({ navigation }: FeedScreenProps) {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');

  const filter = useMemo<FeedFilter>(
    () => ({ text: text.trim() || undefined, country: location.trim() || undefined }),
    [text, location],
  );
  const { sections, isLoading, error, refetch } = useFeed(filter);
  const hasAnyItems = sections.some((section) => section.items.length > 0);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, paddingBottom: 0, gap: spacing.sm }}>
        <Text style={typography.displayMd}>Feed</Text>
        <TextField label="Search" value={text} onChangeText={setText} placeholder="Search your friends' activities" />
        <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Filter by city or country" />
        {error && <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>}
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        data={sections}
        keyExtractor={(section) => section.category}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={!isLoading && !error ? <Text style={typography.body}>Nothing to show yet.</Text> : null}
        renderItem={({ item: section }) =>
          section.items.length === 0 && hasAnyItems ? null : (
            <View style={{ gap: spacing.sm }}>
              <Text style={typography.subtitle}>{CATEGORY_LABELS[section.category]}</Text>
              {section.items.length === 0 ? (
                <Text style={typography.bodySmall}>Nothing here yet.</Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {section.items.map((item) => (
                    <FeedItemCard
                      key={item.experienceId}
                      experienceId={item.experienceId}
                      isFriend={item.isFriend}
                      matchScore={item.matchScore}
                      onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
                    />
                  ))}
                </View>
              )}
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}
