import { FlatList, Pressable, Text, View } from 'react-native';
import { TRAVEL_STYLE_CATEGORIES } from '@amiva/core';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { CATEGORY_LABELS, colors, spacing, typography } from '../../../theme';
import { FeedItemCard } from '../components/FeedItemCard';
import { useSearch } from '../hooks/useSearch';

interface SearchScreenProps {
  navigation: { navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void };
}

export function SearchScreen({ navigation }: SearchScreenProps) {
  const search = useSearch();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text style={typography.displayMd}>Search</Text>
        <TextField
          label="Text"
          value={search.text}
          onChangeText={search.setText}
          onSubmitEditing={() => search.recordSearch(search.text)}
          placeholder="Search experiences"
        />
        <TextField label="Location" value={search.location} onChangeText={search.setLocation} placeholder="City or country" />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {TRAVEL_STYLE_CATEGORIES.map((cat) => {
            const selected = search.category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => search.setCategory(selected ? undefined : cat)}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xxs,
                  borderRadius: 999,
                  backgroundColor: selected ? colors.accent : colors.surfaceAlt,
                }}
              >
                <Text style={{ color: selected ? colors.textOnAccent : colors.textPrimary }}>{CATEGORY_LABELS[cat]}</Text>
              </Pressable>
            );
          })}
        </View>

        {search.recentSearches.length > 0 && (
          <View>
            <Text style={typography.caption}>Recent</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {search.recentSearches.map((q) => (
                <Pressable key={q} onPress={() => search.setText(q)}>
                  <Text style={[typography.bodySmall, { color: colors.accent }]}>{q}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        data={search.results}
        keyExtractor={(item) => item.experience.experienceId}
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
