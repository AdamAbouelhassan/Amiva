import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { RadarChart } from '../../../components/RadarChart';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { orNull } from '../../../lib/queryHelpers';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, spacing, typography } from '../../../theme';
import { useFriendEdge } from '../hooks/useFriends';

interface FriendDetailScreenProps {
  route: { params: { friendId: string } };
}

/** Overlaid radar charts + compatibility % detail
 * (functional_specification.md §2.6, §6.4) — mutual/two-way, so this
 * looks identical from either friend's side. */
export function FriendDetailScreen({ route }: FriendDetailScreenProps) {
  const { friendId } = route.params;
  const { profile } = useCurrentUser();
  const { data: edge } = useFriendEdge(friendId);
  const { data: friend } = useQuery({
    queryKey: ['users', friendId],
    queryFn: () => UserRepository.getById(friendId).then(orNull),
  });

  if (!profile || !friend || !edge) return null;

  return (
    <ScreenContainer>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <ProfileIdentity
          layout="stacked"
          name={friend.name}
          username={friend.username}
          photoUrl={friend.profilePhotoUrl}
        />
        <Text style={typography.statNumber}>{toMatchPercent(edge.compatibilityScore)}% compatible</Text>
      </View>

      <RadarChart
        series={[
          { vector: profile.travelStyle, color: colors.accent, fillOpacity: 0.25 },
          { vector: friend.travelStyle, color: colors.textSecondary, fillOpacity: 0.2 },
        ]}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
        <Legend color={colors.accent} label="You" />
        <Legend color={colors.textSecondary} label={friend.name} />
      </View>
    </ScreenContainer>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={typography.bodySmall}>{label}</Text>
    </View>
  );
}
