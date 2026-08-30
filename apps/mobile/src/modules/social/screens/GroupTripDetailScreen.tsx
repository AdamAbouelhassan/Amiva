import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { Button } from '../../../components/Button';
import { MatchBadge } from '../../../components/MatchBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { colors, spacing, typography } from '../../../theme';
import { useFriends } from '../hooks/useFriends';
import { useAddCollaborator, usePlannedTrip, usePlannedTripItems, useToggleItemCompleted } from '../hooks/useGroupTrip';
import { useGroupRecommendationCandidates } from '../hooks/useGroupRecommendations';

interface GroupTripDetailScreenProps {
  route: { params: { plannedTripId: string } };
}

export function GroupTripDetailScreen({ route }: GroupTripDetailScreenProps) {
  const { plannedTripId } = route.params;
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const { data: friends = [] } = useFriends();
  const addCollaborator = useAddCollaborator(plannedTripId);
  const toggleItem = useToggleItemCompleted(plannedTripId);
  const [showCandidates, setShowCandidates] = useState(false);

  const collaboratorIds = trip ? [trip.ownerId, ...trip.collaboratorIds] : [];
  const candidates = useGroupRecommendationCandidates(collaboratorIds, showCandidates && collaboratorIds.length > 1);

  if (!trip) return null;

  return (
    <ScreenContainer>
      <Text style={typography.displayMd}>{trip.locations.join(', ')}</Text>
      <Text style={typography.bodySmall}>
        {trip.startDate.toDateString()} – {trip.endDate.toDateString()}
      </Text>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Collaborators ({trip.collaboratorIds.length})</Text>
        {friends
          .filter((f) => !trip.collaboratorIds.includes(f.friendId) && f.friendId !== trip.ownerId)
          .map((f) => (
            <Pressable key={f.friendId} onPress={() => addCollaborator.mutate(f.friendId)}>
              <Text style={{ color: colors.accent }}>+ Add friend {f.friendId}</Text>
            </Pressable>
          ))}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={typography.subtitle}>Itinerary (unordered checklist)</Text>
        {items.map((item) => (
          <Pressable
            key={item.itemId}
            onPress={() => toggleItem.mutate({ itemId: item.itemId, completed: !item.completed })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxs }}
          >
            <Text>{item.completed ? '☑' : '☐'}</Text>
            <Text style={[typography.body, item.completed && { textDecorationLine: 'line-through' }]}>{item.title}</Text>
          </Pressable>
        ))}
        {items.length === 0 && <Text style={typography.body}>No items yet.</Text>}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={typography.subtitle}>Group recommendations</Text>
        <Text style={typography.bodySmall}>
          When the group's styles align, we suggest one pick. When they diverge, we show what fits each person instead
          of forcing a compromise.
        </Text>
        <Button label="Check group matches" variant="secondary" onPress={() => setShowCandidates(true)} />
        {candidates.error && <Text style={[typography.bodySmall, { color: colors.danger }]}>{candidates.error}</Text>}

        {candidates.data.map(({ experienceId, title, recommendation }) => (
          <View key={experienceId} style={{ paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={typography.body}>{title}</Text>
            {recommendation.type === 'blended' ? (
              <MatchBadge matchPercent={toMatchPercent(recommendation.matchScore ?? 0)} />
            ) : (
              <View style={{ gap: spacing.xxs }}>
                <Text style={typography.caption}>Group diverges — aligned per person:</Text>
                {recommendation.perCollaborator?.map((p) => (
                  <Text key={p.collaboratorId} style={typography.bodySmall}>
                    {p.collaboratorId}: {toMatchPercent(p.matchScore)}%
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
