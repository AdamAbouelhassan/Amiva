import { memo } from 'react';
import { Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { Card } from '../../../components/Card';
import { IconButton } from '../../../components/IconButton';
import { PressableScale } from '../../../components/PressableScale';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { useSavedPlaceToggle } from '../../../hooks/useSaves';
import { openInGoogleMaps } from '../../../lib/mapsUrl';
import { placePhotoUrl } from '../../../lib/placePhoto';
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

export const PlaceRecommendationCard = memo(function PlaceRecommendationCard({
  place,
  width,
  onAdd,
  added,
}: PlaceRecommendationCardProps) {
  const t = useTheme();
  const tile = width !== undefined;
  const { profile } = useCurrentUser();
  const logNav = useLogExperienceNav();

  const photoUrl = place.photoReferences[0] ? placePhotoUrl(place.photoReferences[0]) : undefined;

  const save = useSavedPlaceToggle(
    {
      placeId: place.placeId,
      name: place.name,
      country: place.country,
      city: place.city,
      lat: place.lat,
      lng: place.lng,
      photoRef: place.photoReferences[0],
      categoryScores: place.categoryScores,
    },
    !onAdd,
  );

  const openMaps = () =>
    openInGoogleMaps({
      name: place.name,
      city: place.city,
      country: place.country,
      placeId: place.placeId,
      lat: place.lat,
      lng: place.lng,
    });

  const iconSize = tile ? 30 : 34;

  return (
    <PressableScale
      onPress={openMaps}
      accessibilityRole="link"
      accessibilityLabel={`Open ${place.name} in Google Maps`}
    >
      {/* Tapping the card opens the place in Google Maps; the corner
          buttons — match TR, Save/Add TL, Log BL — capture their own taps. */}
      <Card padded={false} elevation="raised" style={{ width, overflow: 'hidden' }}>
        <View>
          <AppImage uri={photoUrl} style={{ width: '100%', height: photoUrl ? (tile ? 120 : 160) : tile ? 56 : 64 }} />

          <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs }}>
            <MatchScoreBadge
              matchPercent={toMatchPercent(place.matchScore)}
              vectorA={profile?.travelStyle}
              vectorB={place.categoryScores}
              detailTitle={place.name}
            />
          </View>

          <View style={{ position: 'absolute', top: spacing.xs, left: spacing.xs }}>
            {onAdd ? (
              <IconButton
                variant="overlay"
                name={added ? 'checkmark' : 'add'}
                active={added}
                onPress={onAdd}
                accessibilityLabel={added ? 'Added to plan' : 'Add to plan'}
                size={iconSize}
              />
            ) : (
              <IconButton
                variant="overlay"
                name={save.saved ? 'bookmark' : 'bookmark-outline'}
                active={save.saved}
                onPress={save.toggle}
                accessibilityLabel={save.saved ? 'Saved' : 'Save'}
                size={iconSize}
              />
            )}
          </View>

          <View style={{ position: 'absolute', bottom: spacing.xs, left: spacing.xs }}>
            <IconButton
              variant="overlay"
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
              size={iconSize}
            />
          </View>
        </View>

        <View style={{ padding: tile ? spacing.sm : spacing.md, gap: spacing.xxs }}>
          <Text
            style={[tile ? t.type.body : t.type.subtitle, { fontFamily: t.type.subtitle.fontFamily }]}
            numberOfLines={1}
          >
            {place.name}
          </Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {place.primaryType ? `${place.primaryType} · ` : ''}
            {place.city}, {place.country}
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
});
