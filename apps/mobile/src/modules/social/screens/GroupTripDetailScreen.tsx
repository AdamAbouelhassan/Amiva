import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { AnimatedCheck } from '../../../components/AnimatedCheck';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Section } from '../../../components/Section';
import { useRefresh } from '../../../hooks/useRefresh';
import { orNull } from '../../../lib/queryHelpers';
import { UserRepository } from '../../../repositories/userRepository';
import { radius, spacing, useTheme } from '../../../theme';
import { useFriends } from '../hooks/useFriends';
import {
  useAddCollaborator,
  usePlannedTrip,
  usePlannedTripItems,
  useToggleItemCompleted,
} from '../hooks/useGroupTrip';
import { useGroupRecommendationCandidates } from '../hooks/useGroupRecommendations';

interface GroupTripDetailScreenProps {
  route: { params: { plannedTripId: string } };
}

function useUserName(uid: string) {
  return useQuery({ queryKey: ['users', uid], queryFn: () => UserRepository.getById(uid).then(orNull) });
}

function CollaboratorPill({ uid }: { uid: string }) {
  const { data: user } = useUserName(uid);
  return <ProfileIdentity name={user?.name ?? '…'} username={user?.username} photoUrl={user?.profilePhotoUrl} />;
}

export function GroupTripDetailScreen({ route }: GroupTripDetailScreenProps) {
  const t = useTheme();
  const { plannedTripId } = route.params;
  const { data: trip } = usePlannedTrip(plannedTripId);
  const { data: items = [] } = usePlannedTripItems(plannedTripId);
  const { data: friends = [] } = useFriends();
  const addCollaborator = useAddCollaborator(plannedTripId);
  const toggleItem = useToggleItemCompleted(plannedTripId);
  const [showCandidates, setShowCandidates] = useState(false);
  const refresh = useRefresh();

  const collaboratorIds = trip ? [trip.ownerId, ...trip.collaboratorIds] : [];
  const candidates = useGroupRecommendationCandidates(collaboratorIds, showCandidates && collaboratorIds.length > 1);

  if (!trip) return null;

  const addable = friends.filter(
    (f) => !trip.collaboratorIds.includes(f.friendId) && f.friendId !== trip.ownerId,
  );

  return (
    <ScreenContainer onRefresh={refresh.onRefresh} refreshing={refresh.refreshing}>
      <View style={{ gap: spacing.xxs }}>
        <Text style={t.type.displayMd}>{trip.name || trip.location}</Text>
        <Text style={[t.type.bodySmall, { color: t.colors.textSecondary }]}>
          {trip.location}
          {trip.startDate && trip.endDate
            ? ` · ${trip.startDate.toDateString()} – ${trip.endDate.toDateString()}`
            : ''}
        </Text>
      </View>

      <Section title={`Collaborators (${collaboratorIds.length})`}>
        <Card padded style={{ gap: spacing.sm }}>
          {collaboratorIds.map((uid) => (
            <CollaboratorPill key={uid} uid={uid} />
          ))}
        </Card>
        {addable.map((f) => (
          <Pressable
            key={f.friendId}
            onPress={() => addCollaborator.mutate(f.friendId)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}
          >
            <Text style={[t.type.subtitle, { color: t.colors.accentWarmText }]}>+</Text>
            <CollaboratorPill uid={f.friendId} />
          </Pressable>
        ))}
      </Section>

      <Section title="Itinerary" hint="An unordered checklist — tick things off as you go.">
        {items.length === 0 && (
          <Text style={[t.type.body, { color: t.colors.textSecondary }]}>No items yet.</Text>
        )}
        {items.map((item) => (
          <Pressable
            key={item.itemId}
            onPress={() => toggleItem.mutate({ itemId: item.itemId, completed: !item.completed })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}
          >
            <AnimatedCheck checked={item.completed} />
            <Text
              style={[
                t.type.body,
                item.completed && { textDecorationLine: 'line-through', color: t.colors.textSecondary },
              ]}
            >
              {item.title}
            </Text>
          </Pressable>
        ))}
      </Section>

      <Section
        title="Group recommendations"
        hint="When the group's styles align we suggest one pick. When they diverge we show what fits each person instead of forcing a compromise."
      >
        <Button label="Check group matches" variant="warm" onPress={() => setShowCandidates(true)} />
        {candidates.data.map(({ experienceId, title, recommendation }) => (
          <Card key={experienceId} padded style={{ gap: spacing.xs }}>
            <Text style={t.type.subtitle}>{title}</Text>
            {recommendation.type === 'blended' ? (
              <MatchScoreBadge matchPercent={toMatchPercent(recommendation.matchScore ?? 0)} />
            ) : (
              <View style={{ gap: spacing.xxs }}>
                <Text style={[t.type.caption, { color: t.colors.warning }]}>Group diverges — fit per person:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {recommendation.perCollaborator?.map((p) => (
                    <PerPersonChip key={p.collaboratorId} uid={p.collaboratorId} matchScore={p.matchScore} />
                  ))}
                </View>
              </View>
            )}
          </Card>
        ))}
      </Section>
    </ScreenContainer>
  );
}

function PerPersonChip({ uid, matchScore }: { uid: string; matchScore: number }) {
  const t = useTheme();
  const { data: user } = useUserName(uid);
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
