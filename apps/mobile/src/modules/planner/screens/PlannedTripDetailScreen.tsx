/**
 * Planned trip detail — an itinerary of places to visit, a status, and the
 * completion flow (functional_specification.md §4; 2026-08 Planner rework:
 * itinerary is the only section, populated from a nearby-place search;
 * completion collects photos and moves the trip to the Logbook; a
 * completed trip can be reverted).
 */
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useRefresh } from '../../../hooks/useRefresh';
import { canComplete, displayPlannedTripStatus } from '../../../lib/plannedTripStatus';
import { placePhotoUrl } from '../../../lib/placePhoto';
import { PlannerStackParamList } from '../../../navigation/types';
import { radius, spacing, useTheme } from '../../../theme';
import { StatusSteps } from '../components/StatusSteps';
import { usePlannedTrip, usePlannedTripItems } from '../../../hooks/usePlannedTripData';
import {
  useDeletePlannedTrip,
  useRemovePlannedTripItem,
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

export function PlannedTripDetailScreen({ route, navigation }: PlannedTripDetailScreenProps) {
  const t = useTheme();
  const rootNav = useNavigation<{ navigate: (screen: string, params?: unknown) => void }>();
  const { plannedTripId } = route.params;
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const setStatus = useSetPlannedTripStatus();
  const removeItem = useRemovePlannedTripItem();
  const revert = useRevertCompletedTrip(plannedTripId);
  const deletePlan = useDeletePlannedTrip();
  const refresh = useRefresh();

  if (!trip) return null;

  const completed = trip.status === 'completed';
  const shownStatus = displayPlannedTripStatus(trip.status, trip.startDate);

  function confirmRevert() {
    Alert.alert(
      'Revert this trip?',
      'The Logbook trip it created will be deleted. Any experiences you already logged into it are kept as standalone entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revert', style: 'destructive', onPress: () => revert.mutate() },
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
        {!completed && (
          <Button
            label="Edit"
            variant="secondary"
            onPress={() => navigation.navigate('EditPlannedTrip', { plannedTripId })}
          />
        )}
      </View>

      <StatusSteps status={shownStatus} />

      {!completed && (
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

      {completed ? (
        <Card padded style={{ gap: spacing.sm, borderLeftWidth: 3, borderLeftColor: t.colors.accentWarm }}>
          <Text style={t.type.subtitle}>Completed and moved to your Logbook</Text>
          {trip.convertedToTripId ? (
            <Button
              label="View in Logbook"
              onPress={() =>
                rootNav.navigate('Logbook', {
                  screen: 'TripDetail',
                  params: { tripId: trip.convertedToTripId },
                })
              }
            />
          ) : null}
          <Button
            label={revert.isPending ? 'Reverting…' : 'Revert — I completed this by mistake'}
            variant="secondary"
            onPress={confirmRevert}
            loading={revert.isPending}
          />
          <Pressable onPress={confirmDelete} style={{ alignSelf: 'center', paddingVertical: spacing.xs }}>
            <Text style={[t.type.label, { color: t.colors.danger }]}>
              {deletePlan.isPending ? 'Deleting…' : 'Delete plan'}
            </Text>
          </Pressable>
        </Card>
      ) : (
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
            items.map((item) => {
              const photoUri = item.photoRef ? placePhotoUrl(item.photoRef) : undefined;
              return (
                <View
                  key={item.itemId}
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
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={{ width: 48, height: 48, borderRadius: radius.chip, backgroundColor: t.colors.surfaceAlt }}
                    />
                  ) : (
                    <View
                      style={{ width: 48, height: 48, borderRadius: radius.chip, backgroundColor: t.colors.surfaceAlt }}
                    />
                  )}
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
                  <Pressable
                    hitSlop={8}
                    onPress={() => removeItem.mutate({ itemId: item.itemId, plannedTripId })}
                    style={{ paddingHorizontal: spacing.xs }}
                  >
                    <Text style={[t.type.label, { color: t.colors.danger }]}>Remove</Text>
                  </Pressable>
                </View>
              );
            })
          )}

          {canComplete(trip.endDate) && (
            <Button
              label="Mark trip completed"
              variant="warm"
              onPress={() => navigation.navigate('CompletePlannedTrip', { plannedTripId })}
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}
