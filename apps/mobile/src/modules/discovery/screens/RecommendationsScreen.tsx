import { FlatList, Text, View } from 'react-native';
import { TRAVEL_STYLE_CATEGORIES } from '@amiva/core';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryChip } from '../../../components/CategoryChip';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { spacing, useTheme } from '../../../theme';
import { PlaceRecommendationCard } from '../components/PlaceRecommendationCard';
import { useRecommendations } from '../hooks/useRecommendations';

export function RecommendationsScreen() {
  const t = useTheme();
  const rec = useRecommendations();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <Text style={t.type.displayMd}>For you</Text>
        <TextField label="Search" value={rec.text} onChangeText={rec.setText} placeholder="e.g. street food, museums" />
        <TextField
          label="Country"
          value={rec.country}
          onChangeText={rec.setCountry}
          placeholder="Required — e.g. Portugal"
        />
        <TextField label="City" value={rec.city} onChangeText={rec.setCity} placeholder="Optional — e.g. Lisbon" />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {TRAVEL_STYLE_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              category={cat}
              selected={rec.category === cat}
              onPress={() => rec.setCategory(rec.category === cat ? undefined : cat)}
            />
          ))}
        </View>
        {rec.error && <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{rec.error}</Text>}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.xs, gap: spacing.md }}
        data={rec.results}
        keyExtractor={(item) => item.placeId}
        refreshing={rec.isLoading}
        ListEmptyComponent={
          !rec.isLoading && !rec.error ? (
            <BrandEmptyState
              title={rec.hasSearched ? 'No places found' : 'Where to?'}
              body={
                rec.hasSearched
                  ? 'Try a broader search or a different country.'
                  : 'Enter a country and we’ll pull places that fit your travel style.'
              }
            />
          ) : null
        }
        renderItem={({ item }) => <PlaceRecommendationCard place={item} />}
      />
    </ScreenContainer>
  );
}
