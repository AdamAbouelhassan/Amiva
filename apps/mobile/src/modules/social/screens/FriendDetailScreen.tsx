/**
 * A friend's profile — compatibility (overlaid radar + %), and their
 * visible trips / planned trips / logged experiences. All content is
 * privacy-filtered server-side (functions getUserProfileContent); this
 * screen only renders what it's handed.
 */
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { toMatchPercent, topCategories } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryChip } from '../../../components/CategoryChip';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { TabPanes } from '../../../components/TabPanes';
import { TravelStyleRadar } from '../../../components/TravelStyleRadar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { useTabBarInset } from '../../../hooks/useTabBarInset';
import { orNull } from '../../../lib/queryHelpers';
import { UserRepository } from '../../../repositories/userRepository';
import { radius, spacing, useTheme } from '../../../theme';
import { FeedItemCard } from '../../discovery/components/FeedItemCard';
import { useFriendEdge } from '../hooks/useFriends';
import {
  ProfilePlannedTrip,
  ProfileTrip,
  useUserProfileContent,
} from '../hooks/useUserProfileContent';

interface FriendDetailScreenProps {
  route: { params: { friendId: string } };
}

type Tab = 'compat' | 'trips' | 'logbook';

function fmtRange(a: string, b: string): string {
  const d = (s: string) => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${d(a)} – ${d(b)}`;
}

export function FriendDetailScreen({ route }: FriendDetailScreenProps) {
  const t = useTheme();
  const { friendId } = route.params;
  const { profile } = useCurrentUser();
  const refresh = useRefresh();
  const tabInset = useTabBarInset();
  const navigation = useNavigation<{
    navigate: (screen: 'ExperienceDetail', params: { experienceId: string }) => void;
  }>();
  const [tab, setTab] = useState<Tab>('compat');

  const { data: edge } = useFriendEdge(friendId);
  const { data: friend } = useQuery({
    queryKey: ['users', friendId],
    queryFn: () => UserRepository.getById(friendId).then(orNull),
  });
  const content = useUserProfileContent(friendId);

  const tripRows = useMemo(
    () => [
      ...(content.data?.plannedTrips ?? [])
        .filter((p) => p.status !== 'completed')
        .map((p) => ({ kind: 'plan' as const, item: p })),
      ...(content.data?.trips ?? []).map((tr) => ({ kind: 'trip' as const, item: tr })),
    ],
    [content.data],
  );

  if (!profile || !friend || !edge) return null;

  const makeRC = () => (
    <RefreshControl
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
      tintColor={t.colors.accent}
      colors={[t.colors.accent]}
    />
  );
  const listPad = { padding: spacing.screen, paddingTop: 0, paddingBottom: spacing.screen + tabInset };

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <ProfileIdentity
          layout="stacked"
          name={friend.name}
          username={friend.username}
          photoUrl={friend.profilePhotoUrl}
        />
        <View
          style={{
            alignSelf: 'center',
            backgroundColor: t.colors.accentMuted,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xs,
            borderRadius: radius.pill,
          }}
        >
          <Text style={[t.type.statNumber, { color: t.colors.accent }]}>
            {toMatchPercent(edge.compatibilityScore)}% compatible
          </Text>
        </View>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'compat', label: 'Compatibility' },
            { value: 'trips', label: 'Trips' },
            { value: 'logbook', label: 'Logbook' },
          ]}
        />
      </View>

      <TabPanes
        activeKey={tab}
        panes={[
          {
            key: 'compat',
            node: (
              <ScrollView contentContainerStyle={listPad} refreshControl={makeRC()}>
                <View style={{ alignItems: 'center', gap: spacing.xs }}>
                  <Text style={t.type.subtitle}>{friend.name}'s travel style</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {topCategories(friend.travelStyle).map((c) => (
                      <CategoryChip key={c} category={c} selected />
                    ))}
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
                  <TravelStyleRadar
                    size={300}
                    series={[
                      { vector: profile.travelStyle, kind: 'primary' },
                      { vector: friend.travelStyle, kind: 'compare' },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md }}>
                  <Legend color={t.colors.accent} label="You" />
                  <Legend color={t.colors.radarCompare} label={friend.name} dashed />
                </View>
              </ScrollView>
            ),
          },
          {
            key: 'trips',
            node: (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ ...listPad, gap: spacing.sm }}
                data={tripRows}
                keyExtractor={(r) => `${r.kind}:${r.kind === 'plan' ? r.item.plannedTripId : r.item.tripId}`}
                refreshControl={makeRC()}
                ListEmptyComponent={
                  !content.isLoading ? (
                    <BrandEmptyState title="No trips shared" body={`${friend.name} hasn't shared any trips with you.`} />
                  ) : null
                }
                renderItem={({ item }) =>
                  item.kind === 'plan' ? <PlanCard plan={item.item} /> : <TripCard trip={item.item} />
                }
              />
            ),
          },
          {
            key: 'logbook',
            node: (
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ ...listPad, gap: spacing.md }}
                data={content.data?.experienceIds ?? []}
                keyExtractor={(id) => id}
                refreshControl={makeRC()}
                ListEmptyComponent={
                  !content.isLoading ? (
                    <BrandEmptyState
                      title="Nothing to show"
                      body={`${friend.name} hasn't logged anything, or their logbook is private.`}
                    />
                  ) : null
                }
                renderItem={({ item: experienceId }) => (
                  <FeedItemCard
                    experienceId={experienceId}
                    onPress={() => navigation.navigate('ExperienceDetail', { experienceId })}
                  />
                )}
              />
            ),
          },
        ]}
      />
    </ScreenContainer>
  );
}

function TripCard({ trip }: { trip: ProfileTrip }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: radius.card,
        overflow: 'hidden',
      }}
    >
      {trip.coverPhotoUrl ? <AppImage uri={trip.coverPhotoUrl} style={{ width: '100%', height: 130 }} /> : null}
      <View style={{ padding: spacing.sm, gap: 2 }}>
        <Text style={t.type.subtitle} numberOfLines={1}>
          {trip.name}
        </Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {trip.location} · {fmtRange(trip.startDate, trip.endDate)}
        </Text>
      </View>
    </View>
  );
}

function PlanCard({ plan }: { plan: ProfilePlannedTrip }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderLeftWidth: 3,
        borderLeftColor: t.colors.accentWarm,
        borderRadius: radius.card,
        padding: spacing.sm,
        gap: 2,
      }}
    >
      <Text style={[t.type.caption, { color: t.colors.accentWarmText }]}>Planned</Text>
      <Text style={t.type.subtitle} numberOfLines={1}>
        {plan.name || plan.location}
      </Text>
      <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
        {plan.location} · {fmtRange(plan.startDate, plan.endDate)}
      </Text>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
      <View style={{ width: 14, borderBottomWidth: 3, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={t.type.bodySmall} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
