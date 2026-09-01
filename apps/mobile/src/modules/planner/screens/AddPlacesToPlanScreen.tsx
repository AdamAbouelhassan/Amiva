/**
 * Browse Google Places near a planned trip's destination and add them to
 * its itinerary (2026-08 Planner rework — replaces the old "add from your
 * saves / saved places" lists on the detail screen).
 */
import { useMemo } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryIconFilter } from '../../../components/CategoryIconFilter';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TextField } from '../../../components/TextField';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { CATEGORY_LABELS, spacing, useTheme } from '../../../theme';
import { PlaceRecommendationCard } from '../../discovery/components/PlaceRecommendationCard';
import { LocalSection } from '../../discovery/hooks/useRecommendations';
import { usePlannedTrip, usePlannedTripItems } from '../../../hooks/usePlannedTripData';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { useAddPlannedTripItem } from '../hooks/usePlannedTrips';

interface AddPlacesToPlanScreenProps {
  route: { params: { plannedTripId: string } };
}

export function AddPlacesToPlanScreen({ route }: AddPlacesToPlanScreenProps) {
  const t = useTheme();
  const { plannedTripId } = route.params;
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const addItem = useAddPlannedTripItem();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();

  const search = usePlaceSearch({ country: trip?.country ?? '', city: trip?.city });
  const addedPlaceIds = useMemo(() => new Set(items.map((i) => i.placeId)), [items]);

  if (!trip) return null;

  const sectionTitle = (s: LocalSection) =>
    s.category ? CATEGORY_LABELS[s.category] : `Results for “${search.text.trim()}”`;

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.xs, gap: spacing.xs }}>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          Places near {trip.location}
        </Text>
        <TextField
          value={search.text}
          onChangeText={search.setText}
          placeholder="Keyword — e.g. ramen, hiking, jazz bar"
          returnKeyType="search"
        />
        <CategoryIconFilter value={search.category} onChange={search.setCategory} />
        {search.error && <Text style={[t.type.bodySmall, { color: t.colors.danger }]}>{search.error}</Text>}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.xs, paddingBottom: spacing.screen + tabInset, gap: spacing.lg }}
        data={search.sections}
        keyExtractor={(s) => s.key}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          !search.isLoading && !search.error ? (
            <BrandEmptyState
              title="No places found"
              body="Try a broader keyword or clear the category filter."
            />
          ) : null
        }
        renderItem={({ item: section }) => (
          <View style={{ gap: spacing.sm }}>
            <Text style={t.type.title}>{sectionTitle(section)}</Text>
            {section.items.map((place) => (
              <PlaceRecommendationCard
                key={place.placeId}
                place={place}
                added={addedPlaceIds.has(place.placeId)}
                onAdd={() =>
                  addItem.mutate({
                    plannedTripId,
                    source: 'recommended',
                    placeId: place.placeId,
                    title: place.name,
                    categoryScores: place.categoryScores,
                    city: place.city,
                    country: place.country,
                    photoRef: place.photoReferences[0],
                    lat: place.lat,
                    lng: place.lng,
                  })
                }
              />
            ))}
          </View>
        )}
      />
    </ScreenContainer>
  );
}
