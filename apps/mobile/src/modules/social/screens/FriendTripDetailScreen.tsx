/**
 * A friend's completed trip, read-only — cover photo, notes, photo gallery,
 * and the experiences logged into it. Everything is read from the cached
 * `getUserProfileContent(friendId)` query (already privacy-filtered
 * server-side); this screen never reads the friend's trip doc directly and
 * offers no edit affordances.
 */
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppImage } from '../../../components/AppImage';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useRefresh } from '../../../hooks/useRefresh';
import { radius, spacing, useTheme } from '../../../theme';
import { FeedItemCard } from '../../discovery/components/FeedItemCard';
import { useUserProfileContent } from '../hooks/useUserProfileContent';

interface FriendTripDetailScreenProps {
  route: { params: { friendId: string; tripId: string } };
}

function fmtRange(a: string, b: string): string {
  const d = (s: string) =>
    new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${d(a)} – ${d(b)}`;
}

export function FriendTripDetailScreen({ route }: FriendTripDetailScreenProps) {
  const t = useTheme();
  const { friendId, tripId } = route.params;
  const refresh = useRefresh();
  const navigation = useNavigation<{
    navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void;
  }>();

  const content = useUserProfileContent(friendId);
  const trip = content.data?.trips.find((tr) => tr.tripId === tripId);
  const experienceIds = (content.data?.experiences ?? [])
    .filter((e) => e.tripId === tripId)
    .map((e) => e.experienceId);

  if (!trip) {
    return (
      <ScreenContainer>
        {content.isLoading ? null : (
          <BrandEmptyState title="Trip unavailable" body="This trip isn't shared with you anymore." />
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
      {trip.coverPhotoUrl ? (
        <AppImage uri={trip.coverPhotoUrl} style={{ width: '100%', height: 200, borderRadius: radius.card }} />
      ) : null}

      <View style={{ gap: spacing.xxs }}>
        <Text style={t.type.displayMd}>{trip.name}</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          {trip.location} · {fmtRange(trip.startDate, trip.endDate)}
        </Text>
      </View>

      {trip.notes ? (
        <View style={{ gap: spacing.xxs }}>
          <Text style={t.type.label}>Notes</Text>
          <Text style={t.type.body}>{trip.notes}</Text>
        </View>
      ) : null}

      {trip.accommodation ? (
        <View style={{ gap: spacing.xxs }}>
          <Text style={t.type.label}>Accommodation</Text>
          <Text style={t.type.body}>{trip.accommodation}</Text>
        </View>
      ) : null}

      {trip.photoUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {trip.photoUrls.map((uri) => (
            <AppImage key={uri} uri={uri} style={{ width: 120, height: 120, borderRadius: radius.chip }} />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text style={t.type.label}>Experiences</Text>
        {experienceIds.map((experienceId) => (
          <FeedItemCard
            key={experienceId}
            experienceId={experienceId}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId })}
          />
        ))}
        {experienceIds.length === 0 && (
          <Text style={[t.type.body, { color: t.colors.textSecondary }]}>No experiences logged into this trip.</Text>
        )}
      </View>
    </ScreenContainer>
  );
}
