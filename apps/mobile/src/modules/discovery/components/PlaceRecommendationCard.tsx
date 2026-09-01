import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { Card } from '../../../components/Card';
import { IconButton } from '../../../components/IconButton';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { openInGoogleMaps } from '../../../lib/mapsUrl';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { SavedPlaceRepository } from '../../../repositories/savedPlaceRepository';
import { spacing, useTheme } from '../../../theme';
import { PlaceRecommendationResult } from '../hooks/useRecommendations';

interface PlaceRecommendationCardProps {
  place: PlaceRecommendationResult;
  /** Fixed width — set for tiles inside a horizontal category row. */
  width?: number;
  /** "Add to plan" mode (planner) — replaces the Save action. */
  onAdd?: () => void;
  added?: boolean;
}

export function PlaceRecommendationCard({ place, width, onAdd, added }: PlaceRecommendationCardProps) {
  const t = useTheme();
  const tile = width !== undefined;
  const { profile } = useCurrentUser();
  const queryClient = useQueryClient();
  const logNav = useLogExperienceNav();

  const photoUrl = place.photoReferences[0] ? placePhotoUrl(place.photoReferences[0]) : undefined;

  const savedQuery = useQuery({
    queryKey: ['savedPlaces', 'isSaved', profile?.uid, place.placeId],
    queryFn: () => SavedPlaceRepository.isSaved(profile!.uid, place.placeId),
    enabled: !!profile && !onAdd,
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
          lat: place.lat,
          lng: place.lng,
          photoRef: place.photoReferences[0],
          categoryScores: place.categoryScores,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPlaces', 'isSaved', profile?.uid, place.placeId] });
      queryClient.invalidateQueries({ queryKey: ['savedPlaces', profile?.uid] });
    },
  });

  const openMaps = () =>
    openInGoogleMaps({
      name: place.name,
      city: place.city,
      country: place.country,
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng,
    });

  return (
    <Card padded={false} elevation="raised" style={{ width, overflow: 'hidden' }}>
      {/* Tapping the card opens the place in Google Maps; the action
          buttons below capture their own taps. */}
      <Pressable onPress={openMaps} accessibilityRole="link" accessibilityLabel={`Open ${place.name} in Google Maps`}>
        <AppImage uri={photoUrl} style={{ width: '100%', height: photoUrl ? (tile ? 120 : 160) : tile ? 56 : 64 }} />
        <View style={{ padding: tile ? spacing.sm : spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs }}>
            <Text
              style={[tile ? t.type.body : t.type.subtitle, { flex: 1, fontFamily: t.type.subtitle.fontFamily }]}
              numberOfLines={1}
            >
              {place.name}
            </Text>
            <MatchScoreBadge
              matchPercent={toMatchPercent(place.matchScore)}
              vectorA={profile?.travelStyle}
              vectorB={place.categoryScores}
              detailTitle={place.name}
            />
          </View>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {place.primaryType ? `${place.primaryType} · ` : ''}
            {place.city}, {place.country}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxs }}>
            {onAdd ? (
              <IconButton
                name={added ? 'checkmark' : 'add'}
                active={added}
                onPress={onAdd}
                accessibilityLabel={added ? 'Added to plan' : 'Add to plan'}
                size={tile ? 30 : 34}
              />
            ) : (
              <IconButton
                name={savedQuery.data ? 'bookmark' : 'bookmark-outline'}
                active={!!savedQuery.data}
                onPress={() => toggleSave.mutate()}
                accessibilityLabel={savedQuery.data ? 'Saved' : 'Save'}
                size={tile ? 30 : 34}
              />
            )}
            <IconButton
              name="add-circle-outline"
              onPress={() =>
                logNav.fromPlace({
                  placeId: place.placeId,
                  name: place.name,
                  city: place.city,
                  country: place.country,
                  lat: place.lat,
                  lng: place.lng,
                  photoRef: place.photoReferences[0],
                  categoryScores: place.categoryScores,
                })
              }
              loading={logNav.preparing}
              accessibilityLabel="Log this as an experience"
              size={tile ? 30 : 34}
            />
          </View>
        </View>
      </Pressable>
    </Card>
  );
}
