import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryChip } from '../../../components/CategoryChip';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { TextField } from '../../../components/TextField';
import { spacing, useTheme } from '../../../theme';
import { FeedItemCard } from '../components/FeedItemCard';
import { TrendingFilter, TrendingScope, useTrending } from '../hooks/useTrending';

interface TrendingScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

const EMPTY_COPY: Record<'global' | 'personalized', string> = {
  global: 'Nothing is trending across Amiva yet — be the first to log something here.',
  personalized: 'Log and save a few experiences so we can tune Trending to your style.',
};

export function TrendingScreen({ navigation }: TrendingScreenProps) {
  const t = useTheme();
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
      <View style={{ padding: spacing.screen, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <Text style={t.type.displayMd}>Trending</Text>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'global', label: 'Global' },
            { value: 'personalized', label: 'For you' },
          ]}
        />
        <TextField label="Search" value={text} onChangeText={setText} placeholder="Search trending activities" />
        <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Filter by city or country" />
        {errorMessage && <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{errorMessage}</Text>}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.xs, gap: spacing.lg }}
        data={sections}
        keyExtractor={(s) => s.category}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={t.colors.accent} />}
        ListEmptyComponent={
          !isLoading && !errorMessage ? <BrandEmptyState title="Nothing trending yet" body={EMPTY_COPY[tab]} /> : null
        }
        renderItem={({ item: section }) => (
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
