import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { TravelStyleRadar, TravelStyleValueList } from '../../../components/TravelStyleRadar';
import { Card } from '../../../components/Card';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { orNull } from '../../../lib/queryHelpers';
import { UserRepository } from '../../../repositories/userRepository';
import { radius, spacing, useTheme } from '../../../theme';
import { useFriendEdge } from '../hooks/useFriends';

interface FriendDetailScreenProps {
  route: { params: { friendId: string } };
}

/** Overlaid radar charts + compatibility % (functional_specification.md
 * §2.6, §6.4) — mutual/two-way, identical from either side. */
export function FriendDetailScreen({ route }: FriendDetailScreenProps) {
  const t = useTheme();
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

      <View style={{ alignItems: 'center' }}>
        <TravelStyleRadar
          size={300}
          series={[
            { vector: profile.travelStyle, kind: 'primary' },
            { vector: friend.travelStyle, kind: 'compare' },
          ]}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
        <Legend color={t.colors.accent} label="You" />
        <Legend color={t.colors.radarCompare} label={friend.name} dashed />
      </View>

      <Card padded>
        <Text style={[t.type.subtitle, { marginBottom: spacing.xs }]}>{friend.name}'s style</Text>
        <TravelStyleValueList vector={friend.travelStyle} />
      </Card>
    </ScreenContainer>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
      <View
        style={{ width: 14, borderBottomWidth: 3, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }}
      />
      <Text style={t.type.bodySmall} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
