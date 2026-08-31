import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { Card } from '../../../components/Card';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { openInGoogleMaps } from '../../../lib/mapsUrl';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { SavedPlaceRepository } from '../../../repositories/savedPlaceRepository';
import { radius, spacing, useTheme } from '../../../theme';
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

  return (
    <Card padded={false} elevation="raised" style={{ width, overflow: 'hidden' }}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={{ width: '100%', height: tile ? 120 : 160 }} />
      ) : (
        <View style={{ width: '100%', height: tile ? 56 : 64, backgroundColor: t.colors.surfaceAlt }} />
      )}
      <View style={{ padding: tile ? spacing.sm : spacing.md, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs }}>
          <Text style={[tile ? t.type.body : t.type.subtitle, { flex: 1, fontFamily: t.type.subtitle.fontFamily }]} numberOfLines={1}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxs }}>
          {onAdd ? (
            <Pressable
              hitSlop={8}
              onPress={onAdd}
              disabled={added}
              style={{
                paddingVertical: spacing.xxs,
                paddingHorizontal: spacing.sm,
                borderRadius: radius.pill,
                backgroundColor: added ? t.colors.accent : t.colors.accentMuted,
              }}
            >
              <Text style={[t.type.label, { color: added ? t.colors.textOnAccent : t.colors.accent }]}>
                {added ? 'Added ✓' : 'Add to plan'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              hitSlop={8}
              onPress={() => toggleSave.mutate()}
              style={{
                paddingVertical: spacing.xxs,
                paddingHorizontal: spacing.sm,
                borderRadius: radius.pill,
                backgroundColor: savedQuery.data ? t.colors.accent : t.colors.accentMuted,
              }}
            >
              <Text style={[t.type.label, { color: savedQuery.data ? t.colors.textOnAccent : t.colors.accent }]}>
                {savedQuery.data ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          )}

          <Pressable
            hitSlop={8}
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
            style={{ paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm }}
          >
            <Text style={[t.type.label, { color: t.colors.accent }]}>{logNav.preparing ? '…' : 'Log this'}</Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel={`Open ${place.name} in Google Maps`}
            onPress={() =>
              openInGoogleMaps({
                name: place.name,
                city: place.city,
                country: place.country,
                placeId: place.placeId,
                lat: place.lat,
                lng: place.lng,
              })
            }
            style={{ paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm }}
          >
            <Text style={[t.type.label, { color: t.colors.textSecondary }]}>{tile ? 'Maps' : 'Open in Maps'}</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
