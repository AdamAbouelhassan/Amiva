import { FlatList, Pressable, Text, View } from 'react-native';
import { TRAVEL_STYLE_CATEGORIES } from '@amiva/core';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { CATEGORY_LABELS, colors, spacing, typography } from '../../../theme';
import { PlaceRecommendationCard } from '../components/PlaceRecommendationCard';
import { useRecommendations } from '../hooks/useRecommendations';

export function RecommendationsScreen() {
  const rec = useRecommendations();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, paddingBottom: 0, gap: spacing.sm }}>
        <Text style={typography.displayMd}>For you</Text>
        <TextField label="Search" value={rec.text} onChangeText={rec.setText} placeholder="e.g. street food, museums" />
        <TextField label="Country" value={rec.country} onChangeText={rec.setCountry} placeholder="Required — e.g. Portugal" />
        <TextField label="City" value={rec.city} onChangeText={rec.setCity} placeholder="Optional — e.g. Lisbon" />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {TRAVEL_STYLE_CATEGORIES.map((cat) => {
            const selected = rec.category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => rec.setCategory(selected ? undefined : cat)}
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
        {rec.error && <Text style={[typography.bodySmall, { color: colors.danger }]}>{rec.error}</Text>}
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        data={rec.results}
        keyExtractor={(item) => item.placeId}
        refreshing={rec.isLoading}
        ListEmptyComponent={
          !rec.isLoading && !rec.error ? (
            <Text style={typography.body}>
              {rec.hasSearched ? 'No places found.' : 'Enter a country to see recommendations.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => <PlaceRecommendationCard place={item} />}
      />
    </ScreenContainer>
  );
}
