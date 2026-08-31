import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { Card } from '../../../components/Card';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { SavedPlaceRepository } from '../../../repositories/savedPlaceRepository';
import { radius, spacing, useTheme } from '../../../theme';
import { PlaceRecommendationResult } from '../hooks/useRecommendations';

interface PlaceRecommendationCardProps {
  place: PlaceRecommendationResult;
}

export function PlaceRecommendationCard({ place }: PlaceRecommendationCardProps) {
  const t = useTheme();
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
    <Card padded style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
        <Text style={[t.type.subtitle, { flex: 1 }]} numberOfLines={1}>
          {place.name}
        </Text>
        <MatchScoreBadge
          matchPercent={toMatchPercent(place.matchScore)}
          vectorA={profile?.travelStyle}
          vectorB={place.categoryScores}
          detailTitle={place.name}
        />
      </View>
      <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
        {place.city}, {place.country}
      </Text>
      <Pressable
        hitSlop={8}
        onPress={() => toggleSave.mutate()}
        style={{
          alignSelf: 'flex-start',
          marginTop: spacing.xxs,
          paddingVertical: spacing.xxs,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: savedQuery.data ? t.colors.accent : t.colors.accentMuted,
        }}
      >
        <Text
          style={[t.type.label, { color: savedQuery.data ? t.colors.textOnAccent : t.colors.accent }]}
        >
          {savedQuery.data ? 'Saved' : 'Save'}
        </Text>
      </Pressable>
    </Card>
  );
}
