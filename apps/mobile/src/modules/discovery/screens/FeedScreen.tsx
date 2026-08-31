import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryChip } from '../../../components/CategoryChip';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { spacing, useTheme } from '../../../theme';
import { DiscoveryStackParamList } from '../../../navigation/types';
import { FeedItemCard } from '../components/FeedItemCard';
import { FeedFilter, useFeed } from '../hooks/useFeed';

interface FeedScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: DiscoveryStackParamList['ExperienceDetail']) => void };
}

export function FeedScreen({ navigation }: FeedScreenProps) {
  const t = useTheme();
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');

  const filter = useMemo<FeedFilter>(
    () => ({ text: text.trim() || undefined, country: location.trim() || undefined }),
    [text, location],
  );
  const { sections, isLoading, error, refetch } = useFeed(filter);
  const hasAnyItems = sections.some((s) => s.items.length > 0);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <Text style={t.type.displayMd}>Feed</Text>
        <TextField label="Search" value={text} onChangeText={setText} placeholder="Search your friends' activities" />
        <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Filter by city or country" />
        {error && <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{error}</Text>}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.xs, gap: spacing.lg }}
        data={sections}
        keyExtractor={(s) => s.category}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={t.colors.accent} />}
        ListEmptyComponent={
          !isLoading && !error && !hasAnyItems ? (
            <BrandEmptyState
              title="Your feed is quiet"
              body="Add friends and log experiences — matches to your style will show up here first."
            />
          ) : null
        }
        renderItem={({ item: section }) =>
          section.items.length === 0 && hasAnyItems ? null : (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row' }}>
                <CategoryChip category={section.category} />
              </View>
              {section.items.length === 0 ? (
                <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>Nothing here yet.</Text>
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
