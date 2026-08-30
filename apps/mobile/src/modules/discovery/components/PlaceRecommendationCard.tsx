import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { MatchBadge } from '../../../components/MatchBadge';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { SavedPlaceRepository } from '../../../repositories/savedPlaceRepository';
import { colors, radius, spacing, typography } from '../../../theme';
import { PlaceRecommendationResult } from '../hooks/useRecommendations';

interface PlaceRecommendationCardProps {
  place: PlaceRecommendationResult;
}

/** A raw Google Place, not an Amiva post — no ExperienceDetail to open
 * (no POI detail page in MVP, functional_specification.md §7), so this
 * card is just the match preview + a save action, feeding
 * `savedPlaces` -> Planner's "Add from your saved places"
 * (PlannedTripDetailScreen.tsx). */
export function PlaceRecommendationCard({ place }: PlaceRecommendationCardProps) {
  const { profile } = useCurrentUser();
  const queryClient = useQueryClient();

  const savedQuery = useQuery({
    queryKey: ['savedPlaces', 'isSaved', profile?.uid, place.placeId],
    queryFn: () => SavedPlaceRepository.isSaved(profile!.uid, place.placeId),
    enabled: !!profile,
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (savedQuery.data) {
        await SavedPlaceRepository.unsave(profile.uid, place.placeId);
      } else {
        await SavedPlaceRepository.save({
          userId: profile.uid,
          placeId: place.placeId,
          name: place.name,
          country: place.country,
          city: place.city,
          categoryScores: place.categoryScores,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPlaces', 'isSaved', profile?.uid, place.placeId] });
      queryClient.invalidateQueries({ queryKey: ['savedPlaces', profile?.uid] });
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={typography.subtitle} numberOfLines={1}>
          {place.name}
        </Text>
        <MatchBadge matchPercent={toMatchPercent(place.matchScore)} />
      </View>
      <Text style={typography.bodySmall}>
        {place.city}, {place.country}
      </Text>
      <Pressable hitSlop={8} onPress={() => toggleSave.mutate()} style={styles.saveRow}>
        <Text style={styles.saveLabel}>{savedQuery.data ? '✓ Saved' : '+ Save'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveRow: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
  },
  saveLabel: {
    ...typography.caption,
    color: colors.accent,
  },
});
