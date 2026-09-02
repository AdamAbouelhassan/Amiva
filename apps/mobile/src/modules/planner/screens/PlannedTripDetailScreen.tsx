/**
 * Planned trip detail — an itinerary of places, a status, the trip party
 * (co-editors), and per-participant completion (functional_specification.md
 * §4, §6; 2026-09 shared-trip rework).
 *
 * - The owner and every collaborator co-edit the itinerary
 *   (`firestore.rules` `plannedTrips` — direct-add, no invite/accept).
 * - Only the owner edits trip details / adds collaborators / deletes.
 * - After the end date each participant independently adds the trip to
 *   **their own** Logbook (their own trip doc + photos + entries), via the
 *   `convertPlannedTripToLogbook` callable; each can remove their own copy.
 * - A friend who is neither owner nor collaborator (reached from a friend's
 *   profile) sees everything read-only.
 */
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { toMatchPercent, zeroTravelStyleVector } from '@amiva/core';
import { AppImage } from '../../../components/AppImage';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { IconButton } from '../../../components/IconButton';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { PressableScale } from '../../../components/PressableScale';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Section } from '../../../components/Section';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useLogExperienceNav } from '../../../hooks/useLogExperienceNav';
import { useRefresh } from '../../../hooks/useRefresh';
import { orNull } from '../../../lib/queryHelpers';
import { openInGoogleMaps } from '../../../lib/mapsUrl';
import { canComplete, displayPlannedTripStatus } from '../../../lib/plannedTripStatus';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { PlannerStackParamList } from '../../../navigation/types';
import { PlannedTripItemDoc } from '../../../repositories/types';
import { UserRepository } from '../../../repositories/userRepository';
import { radius, spacing, useTheme } from '../../../theme';
import { StatusSteps } from '../components/StatusSteps';
import { useGroupRecommendationCandidates } from '../../social/hooks/useGroupRecommendations';
import { useFriends } from '../../social/hooks/useFriends';
import { usePlannedTrip, usePlannedTripItems } from '../../../hooks/usePlannedTripData';
import {
  useAddTripCollaborator,
  useDeletePlannedTrip,
  useRemovePlannedTripItem,
  useRemoveTripCollaborator,
  useSetPlannedTripStatus,
} from '../hooks/usePlannedTrips';
import { useRevertCompletedTrip } from '../hooks/useRevertCompletedTrip';

interface PlannedTripDetailScreenProps {
  route: { params: { plannedTripId: string } };
  navigation: {
    navigate: <T extends keyof PlannerStackParamList>(screen: T, params?: PlannerStackParamList[T]) => void;
    goBack: () => void;
  };
}

function fmtRange(start: Date, end: Date): string {
  return `${start.toDateString()} – ${end.toDateString()}`;
}

function useUser(uid: string) {
  return useQuery({ queryKey: ['users', uid], queryFn: () => UserRepository.getById(uid).then(orNull) });
}

export function PlannedTripDetailScreen({ route, navigation }: PlannedTripDetailScreenProps) {
  const t = useTheme();
  const rootNav = useNavigation<{ navigate: (screen: string, params?: unknown) => void }>();
  const { plannedTripId } = route.params;
  const { profile } = useCurrentUser();
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const { data: friends = [] } = useFriends();
  const setStatus = useSetPlannedTripStatus();
  const removeItem = useRemovePlannedTripItem();
  const addCollaborator = useAddTripCollaborator(plannedTripId);
  const removeCollaborator = useRemoveTripCollaborator(plannedTripId);
  const revert = useRevertCompletedTrip(plannedTripId);
  const deletePlan = useDeletePlannedTrip();
  const logNav = useLogExperienceNav();
  const refresh = useRefresh();
  const [showGroupMatches, setShowGroupMatches] = useState(false);

  const uid = profile?.uid ?? '';
  const participantIds = trip ? [trip.ownerId, ...trip.collaboratorIds] : [];
  const groupMatches = useGroupRecommendationCandidates(
    participantIds,
    showGroupMatches && participantIds.length > 1,
  );

  if (!trip || !profile) return null;

  const isOwner = trip.ownerId === uid;
  const isCollaborator = participantIds.includes(uid);
  const myLoggedTripId = trip.loggedTripIds[uid];
  const endPassed = canComplete(trip.endDate);
  const shownStatus = displayPlannedTripStatus(trip.status, trip.startDate);

  const addableFriends = friends.filter((f) => !participantIds.includes(f.friendId));

  function confirmRemoveMyCopy() {
    Alert.alert(
      'Remove from your Logbook?',
      'The Logbook trip this created is deleted. Any experiences you logged into it are kept as standalone entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => revert.mutate() },
      ],
    );
  }

  function confirmDelete() {
    Alert.alert('Delete this plan?', 'The plan and its itinerary are removed. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan.mutateAsync(plannedTripId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Could not delete plan', err instanceof Error ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={t.type.displayMd}>{trip.name || trip.location}</Text>
          <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
            {trip.location} · {fmtRange(trip.startDate, trip.endDate)}
          </Text>
        </View>
        {isOwner && (
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => navigation.navigate('EditPlannedTrip', { plannedTripId })}
          />
        )}
      </View>

      <StatusSteps status={shownStatus} />

      {isOwner && trip.status !== 'completed' && (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {trip.status === 'upcoming' ? (
            <Button
              label="Back to planning"
              variant="secondary"
              onPress={() => setStatus.mutate({ plannedTripId, status: 'planning' })}
            />
          ) : (
            <Button
              label="Mark as upcoming"
              variant="secondary"
              onPress={() => setStatus.mutate({ plannedTripId, status: 'upcoming' })}
            />
          )}
        </View>
      )}

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

      {/* --- Trip party -------------------------------------------------- */}
      <Section
        title={`Trip party (${participantIds.length})`}
        hint={
          isOwner
            ? 'Everyone here can add and remove itinerary stops.'
            : isCollaborator
              ? 'You can add and remove itinerary stops.'
              : undefined
        }
      >
        <Card padded style={{ gap: spacing.sm }}>
          {participantIds.map((pid) => (
            <ParticipantRow
              key={pid}
              uid={pid}
              isYou={pid === uid}
              logged={!!trip.loggedTripIds[pid]}
              canRemove={isOwner && pid !== trip.ownerId}
              onRemove={() => removeCollaborator.mutate(pid)}
            />
          ))}
        </Card>
        {isOwner &&
          addableFriends.map((f) => (
            <Pressable
              key={f.friendId}
              onPress={() => addCollaborator.mutate(f.friendId)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}
            >
              <Text style={[t.type.subtitle, { color: t.colors.accentWarmText }]}>+</Text>
              <ParticipantRow uid={f.friendId} />
            </Pressable>
          ))}
      </Section>

      {trip.status !== 'completed' && isCollaborator && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text style={t.type.subtitle}>Itinerary</Text>
            <Button
              label="Add places"
              variant="secondary"
              onPress={() => navigation.navigate('AddPlacesToPlan', { plannedTripId })}
            />
          </View>

          {items.length === 0 ? (
            <Text style={[t.type.body, { color: t.colors.textSecondary }]}>
              No stops yet — tap “Add places” to browse spots near {trip.location}.
            </Text>
          ) : (
            items.map((item) => (
              <ItineraryRow
                key={item.itemId}
                item={item}
                canRemove={isCollaborator}
                onRemove={() => removeItem.mutate({ itemId: item.itemId, plannedTripId })}
                onLog={
                  myLoggedTripId
                    ? () =>
                        logNav.fromPlace(
                          {
                            placeId: item.placeId,
                            name: item.title,
                            city: item.city ?? '',
                            country: item.country ?? '',
                            lat: item.lat,
                            lng: item.lng,
                            photoRef: item.photoRef,
                            categoryScores: item.categoryScores ?? zeroTravelStyleVector(),
                          },
                          { tripId: myLoggedTripId },
                        )
                    : undefined
                }
              />
            ))
          )}
        </>
      )}

      {trip.status === 'completed' && (
        <Section title="Itinerary">
          {items.length === 0 ? (
            <Text style={[t.type.body, { color: t.colors.textSecondary }]}>No stops were added.</Text>
          ) : (
            items.map((item) => (
              <ItineraryRow
                key={item.itemId}
                item={item}
                canRemove={false}
                onLog={
                  myLoggedTripId
                    ? () =>
                        logNav.fromPlace(
                          {
                            placeId: item.placeId,
                            name: item.title,
                            city: item.city ?? '',
                            country: item.country ?? '',
                            lat: item.lat,
                            lng: item.lng,
                            photoRef: item.photoRef,
                            categoryScores: item.categoryScores ?? zeroTravelStyleVector(),
                          },
                          { tripId: myLoggedTripId },
                        )
                    : undefined
                }
              />
            ))
          )}
        </Section>
      )}

      {/* --- Group matches (functional_specification.md §6.2) ----------- */}
      {participantIds.length > 1 && isCollaborator && (
        <Section
          title="Group matches"
          hint="When the party's styles align we suggest one pick; when they diverge we show the fit per person instead of forcing a compromise."
        >
          {!showGroupMatches ? (
            <Button label="Check group matches" variant="warm" onPress={() => setShowGroupMatches(true)} />
          ) : groupMatches.isLoading ? (
            <Text style={[t.type.body, { color: t.colors.textSecondary }]}>Checking…</Text>
          ) : groupMatches.data.length === 0 ? (
            <Text style={[t.type.body, { color: t.colors.textSecondary }]}>No group matches to show yet.</Text>
          ) : (
            groupMatches.data.map(({ experienceId, title, recommendation }) => (
              <Card key={experienceId} padded style={{ gap: spacing.xs }}>
                <Text style={t.type.subtitle}>{title}</Text>
                {recommendation.type === 'blended' ? (
                  <MatchScoreBadge matchPercent={toMatchPercent(recommendation.matchScore ?? 0)} />
                ) : (
                  <View style={{ gap: spacing.xxs }}>
                    <Text style={[t.type.caption, { color: t.colors.warning }]}>Party diverges — fit per person:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                      {recommendation.perCollaborator?.map((p) => (
                        <PerPersonChip key={p.collaboratorId} uid={p.collaboratorId} matchScore={p.matchScore} />
                      ))}
                    </View>
                  </View>
                )}
              </Card>
            ))
          )}
        </Section>
      )}

      {/* --- Completion (per participant) ------------------------------ */}
      {isCollaborator && (endPassed || myLoggedTripId) && (
        <Card padded style={{ gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: t.colors.accentWarm }}>
          {myLoggedTripId ? (
            <>
              <Text style={t.type.subtitle}>This trip is in your Logbook</Text>
              <Button
                label="View in my Logbook"
                onPress={() =>
                  rootNav.navigate('Logbook', { screen: 'TripDetail', params: { tripId: myLoggedTripId } })
                }
              />
              <Button
                label={revert.isPending ? 'Removing…' : 'Remove from my Logbook'}
                variant="danger"
                onPress={confirmRemoveMyCopy}
                loading={revert.isPending}
              />
            </>
          ) : (
            <>
              <Text style={t.type.subtitle}>Add this trip to your Logbook</Text>
              <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
                You'll get your own trip with your own photos, then log your own experiences into it.
              </Text>
              <Button
                label="Add to my Logbook"
                variant="warm"
                onPress={() => navigation.navigate('CompletePlannedTrip', { plannedTripId })}
              />
            </>
          )}
        </Card>
      )}

      {isOwner && (
        <Pressable onPress={confirmDelete} style={{ alignSelf: 'center', paddingVertical: spacing.sm }}>
          <Text style={[t.type.label, { color: t.colors.danger }]}>
            {deletePlan.isPending ? 'Deleting…' : 'Delete plan'}
          </Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

function ParticipantRow({
  uid,
  isYou,
  logged,
  canRemove,
  onRemove,
}: {
  uid: string;
  isYou?: boolean;
  logged?: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}) {
  const t = useTheme();
  const { data: user } = useUser(uid);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View style={{ flex: 1 }}>
        <ProfileIdentity
          name={`${user?.name ?? '…'}${isYou ? '  ·  You' : ''}`}
          username={user?.username}
          photoUrl={user?.profilePhotoUrl}
        />
      </View>
      {logged ? <Text style={[t.type.caption, { color: t.colors.accent }]}>In their Logbook</Text> : null}
      {canRemove ? (
        <IconButton name="close" tone="danger" onPress={onRemove ?? (() => {})} accessibilityLabel="Remove from trip" />
      ) : null}
    </View>
  );
}

function ItineraryRow({
  item,
  canRemove,
  onRemove,
  onLog,
}: {
  item: PlannedTripItemDoc;
  canRemove: boolean;
  onRemove?: () => void;
  onLog?: () => void;
}) {
  const t = useTheme();
  const photoUri = item.photoRef ? placePhotoUrl(item.photoRef) : undefined;
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`Open ${item.title} in Maps`}
      onPress={() =>
        openInGoogleMaps({
          name: item.title,
          city: item.city,
          country: item.country,
          placeId: item.placeId,
          lat: item.lat,
          lng: item.lng,
        })
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
        borderRadius: radius.card,
        padding: spacing.sm,
      }}
    >
      <AppImage uri={photoUri} style={{ width: 48, height: 48, borderRadius: radius.chip }} />
      <View style={{ flex: 1 }}>
        <Text style={t.type.body} numberOfLines={1}>
          {item.title}
        </Text>
        {item.city ? (
          <Text style={[t.type.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {item.city}
            {item.country ? `, ${item.country}` : ''}
          </Text>
        ) : null}
      </View>
      {onLog ? (
        <IconButton name="add-circle-outline" onPress={onLog} accessibilityLabel="Log this experience" />
      ) : null}
      {canRemove ? (
        <Pressable hitSlop={8} onPress={onRemove} style={{ paddingHorizontal: spacing.xs }}>
          <Text style={[t.type.label, { color: t.colors.danger }]}>Remove</Text>
        </Pressable>
      ) : null}
    </PressableScale>
  );
}

function PerPersonChip({ uid, matchScore }: { uid: string; matchScore: number }) {
  const t = useTheme();
  const { data: user } = useUser(uid);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radius.pill,
        backgroundColor: t.colors.surfaceAlt,
      }}
    >
      <Text style={t.type.caption}>{user?.name ?? '…'}</Text>
      <Text style={[t.type.caption, { color: t.colors.accent }]}>{toMatchPercent(matchScore)}%</Text>
    </View>
  );
}
