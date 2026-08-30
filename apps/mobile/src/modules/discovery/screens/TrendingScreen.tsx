import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { CATEGORY_LABELS, colors, spacing, typography } from '../../../theme';
import { FeedItemCard } from '../components/FeedItemCard';
import { TrendingFilter, TrendingScope, useTrending } from '../hooks/useTrending';

interface TrendingScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function TrendingScreen({ navigation }: TrendingScreenProps) {
  const [tab, setTab] = useState<'global' | 'personalized'>('global');
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');

  const scope: TrendingScope = { type: tab };
  const filter = useMemo<TrendingFilter>(
    () => ({ text: text.trim() || undefined, country: location.trim() || undefined }),
    [text, location],
  );
  const { data: sections = [], isLoading, error, refetch } = useTrending(scope, filter);
  const errorMessage = error instanceof Error ? error.message : undefined;

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, paddingBottom: 0, gap: spacing.sm }}>
        <Text style={typography.displayMd}>Trending</Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {(['global', 'personalized'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)}>
              <Text style={[typography.subtitle, tab === t && { color: colors.accent }]}>
                {t === 'global' ? 'Global' : 'For you'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextField label="Search" value={text} onChangeText={setText} placeholder="Search trending activities" />
        <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Filter by city or country" />
        {errorMessage && <Text style={[typography.bodySmall, { color: colors.danger }]}>{errorMessage}</Text>}
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        data={sections}
        keyExtractor={(section) => section.category}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={!isLoading && !errorMessage ? <Text style={typography.body}>Nothing trending yet.</Text> : null}
        renderItem={({ item: section }) => (
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
                    matchScore={item.matchScore}
                    onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      />
    </ScreenContainer>
  );
}
