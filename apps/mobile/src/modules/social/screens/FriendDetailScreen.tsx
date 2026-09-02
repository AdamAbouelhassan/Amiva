/**
 * A friend's profile — compatibility (overlaid radar + %), their current
 * planned trips, and a Logbook timeline (trips + experiences merged,
 * newest first — mirrors the owner's own Logbook). All content is
 * privacy-filtered server-side (functions getUserProfileContent); this
 * screen only renders what it's handed.
 *
 * Each tab is its own component (own `useRefresh`) and the `panes` array is
 * memoised — the same pattern as DiscoveryScreen. Rendering the pane bodies
 * inline made the kept-mounted FlatLists reconcile on every parent render,
 * which cancelled in-flight taps on the experience cards.
 */
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { toMatchPercent, topCategories, TravelStyleVector } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { CategoryChip } from '../../../components/CategoryChip';
import { PressableScale } from '../../../components/PressableScale';
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

type TimelineRow =
  | { kind: 'trip'; id: string; date: number; trip: ProfileTrip }
  | { kind: 'exp'; id: string; date: number; experienceId: string };

type Nav = { navigate: (screen: string, params?: unknown) => void };

function fmtRange(a: string, b: string): string {
  const d = (s: string) => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${d(a)} – ${d(b)}`;
}

export function FriendDetailScreen({ route }: FriendDetailScreenProps) {
  const t = useTheme();
  const { friendId } = route.params;
  const { profile } = useCurrentUser();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('compat');

  const { data: edge } = useFriendEdge(friendId);
  const { data: friend } = useQuery({
    queryKey: ['users', friendId],
    queryFn: () => UserRepository.getById(friendId).then(orNull),
  });

  const panes = useMemo(
    () =>
      friend && profile
        ? [
            {
              key: 'compat',
              node: (
                <CompatPane myStyle={profile.travelStyle} friendStyle={friend.travelStyle} friendName={friend.name} />
              ),
            },
            { key: 'trips', node: <TripsPane friendId={friendId} friendName={friend.name} navigation={navigation} /> },
            { key: 'logbook', node: <LogbookPane friendId={friendId} friendName={friend.name} navigation={navigation} /> },
          ]
        : [],
    [friend, profile, friendId, navigation],
  );

  if (!profile || !friend || !edge) return null;

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
            height: 38,
            justifyContent: 'center',
            backgroundColor: t.colors.accentMuted,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.pill,
          }}
        >
          <Text
            style={{
              fontFamily: t.type.statNumber.fontFamily,
              fontSize: 17,
              lineHeight: 38,
              color: t.colors.accent,
              includeFontPadding: false,
              textAlign: 'center',
            }}
          >
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

      <TabPanes activeKey={tab} panes={panes} />
    </ScreenContainer>
  );
}

function useProfileRefreshControl() {
  const t = useTheme();
  const refresh = useRefresh();
  return (
    <RefreshControl
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
      tintColor={t.colors.accent}
      colors={[t.colors.accent]}
    />
  );
}

/** Trips tab — the friend's current plans only (soonest first), each opens
 * the shared planned-trip detail on the Planner tab. */
function TripsPane({ friendId, friendName, navigation }: { friendId: string; friendName: string; navigation: Nav }) {
  const tabInset = useTabBarInset();
  const content = useUserProfileContent(friendId);
  const rc = useProfileRefreshControl();

  const rows = useMemo(
    () =>
      (content.data?.plannedTrips ?? [])
        .filter((p) => p.status !== 'completed')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [content.data],
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.screen, paddingTop: 0, paddingBottom: spacing.screen + tabInset, gap: spacing.sm }}
      data={rows}
      keyExtractor={(p) => p.plannedTripId}
      refreshControl={rc}
      removeClippedSubviews={false}
      ListEmptyComponent={
        !content.isLoading ? (
          <BrandEmptyState title="No trips planned" body={`${friendName} has no upcoming trips shared with you.`} />
        ) : null
      }
      renderItem={({ item }) => (
        <PlanCard
          plan={item}
          onPress={() =>
            navigation.navigate('Planner', {
              screen: 'PlannedTripDetail',
              params: { plannedTripId: item.plannedTripId },
            })
          }
        />
      )}
    />
  );
}

/** Logbook tab — trips + experiences merged, newest first (mirrors the
 * owner's own Logbook timeline). */
function LogbookPane({ friendId, friendName, navigation }: { friendId: string; friendName: string; navigation: Nav }) {
  const tabInset = useTabBarInset();
  const content = useUserProfileContent(friendId);
  const rc = useProfileRefreshControl();

  const timeline = useMemo<TimelineRow[]>(() => {
    const rows: TimelineRow[] = [
      ...(content.data?.trips ?? []).map((tr) => ({
        kind: 'trip' as const,
        id: tr.tripId,
        date: new Date(tr.startDate).getTime(),
        trip: tr,
      })),
      ...(content.data?.experiences ?? []).map((e) => ({
        kind: 'exp' as const,
        id: e.experienceId,
        date: new Date(e.date).getTime(),
        experienceId: e.experienceId,
      })),
    ];
    return rows.sort((a, b) => b.date - a.date);
  }, [content.data]);

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.screen, paddingTop: 0, paddingBottom: spacing.screen + tabInset, gap: spacing.md }}
      data={timeline}
      keyExtractor={(row) => `${row.kind}:${row.id}`}
      refreshControl={rc}
      removeClippedSubviews={false}
      ListEmptyComponent={
        !content.isLoading ? (
          <BrandEmptyState
            title="Nothing to show"
            body={`${friendName} hasn't logged anything, or their logbook is private.`}
          />
        ) : null
      }
      renderItem={({ item }) =>
        item.kind === 'trip' ? (
          <FriendTripRow
            trip={item.trip}
            onPress={() => navigation.navigate('FriendTripDetail', { friendId, tripId: item.trip.tripId })}
          />
        ) : (
          <FeedItemCard
            experienceId={item.experienceId}
            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experienceId })}
          />
        )
      }
    />
  );
}

/** The Compatibility tab — sized to fit with no real scroll: the radar is
 * the largest square that fits in the pane once the chips + legend are
 * accounted for. Sized off the ScrollView's own (fixed) height so there's
 * no measure→resize→measure loop. */
function CompatPane({
  myStyle,
  friendStyle,
  friendName,
}: {
  myStyle: TravelStyleVector;
  friendStyle: TravelStyleVector;
  friendName: string;
}) {
  const t = useTheme();
  const tabInset = useTabBarInset();
  const rc = useProfileRefreshControl();
  const { width } = useWindowDimensions();
  const [viewportH, setViewportH] = useState(0);
  const bottomPad = spacing.md + tabInset;

  // Rough vertical cost of the heading + chip row + legend + gaps.
  const CHROME = 150;
  // Only render the radar once we know the real size — mounting it with a
  // guessed size and resizing it makes the animated polygon draw off-centre
  // (its worklet captured the wrong geometry).
  const size = Math.max(160, Math.min(width - spacing.screen * 2, viewportH - CHROME - bottomPad));

  return (
    <ScrollView
      onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.screen, paddingBottom: bottomPad }}
      refreshControl={rc}
    >
      <View style={{ flex: 1, gap: spacing.sm, paddingTop: spacing.xs, alignItems: 'center' }}>
        <Text style={t.type.subtitle}>{friendName}'s travel style</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
          {topCategories(friendStyle).map((c) => (
            <CategoryChip key={c} category={c} selected />
          ))}
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {viewportH > 0 ? (
            <TravelStyleRadar
              size={size}
              animate={false}
              series={[
                { vector: myStyle, kind: 'primary' },
                { vector: friendStyle, kind: 'compare' },
              ]}
            />
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
          <Legend color={t.colors.accent} label="You" />
          <Legend color={t.colors.radarCompare} label={friendName} dashed />
        </View>
      </View>
    </ScrollView>
  );
}

/** A friend's completed trip in the Logbook timeline — same visual as the
 * owner's `TripRow`, but fed by the privacy-filtered `ProfileTrip` payload
 * (string dates, no `ownerId`) rather than a full `TripDoc`. */
function FriendTripRow({ trip, onPress }: { trip: ProfileTrip; onPress: () => void }) {
  const t = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Open ${trip.name}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: radius.card,
        padding: spacing.sm,
      }}
    >
      <AppImage uri={trip.coverPhotoUrl} style={{ width: 56, height: 56, borderRadius: radius.chip }} />
      <View style={{ flex: 1 }}>
        <Text style={t.type.subtitle} numberOfLines={1}>
          {trip.name}
        </Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]} numberOfLines={1}>
          {trip.location} · {fmtRange(trip.startDate, trip.endDate)}
        </Text>
      </View>
    </PressableScale>
  );
}

function PlanCard({ plan, onPress }: { plan: ProfilePlannedTrip; onPress: () => void }) {
  const t = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Open ${plan.name || plan.location}`}
      onPress={onPress}
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
    </PressableScale>
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
