import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { Button } from '../../../components/Button';
import { MatchScoreBadge } from '../../../components/MatchScoreBadge';
import { ProfileIdentity } from '../../../components/ProfileIdentity';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { orNull } from '../../../lib/queryHelpers';
import { UserRepository } from '../../../repositories/userRepository';
import { spacing, useTheme } from '../../../theme';
import { useFriends } from '../hooks/useFriends';

interface FriendsListScreenProps {
  navigation: {
    navigate: (screen: 'FriendDetail' | 'AddFriend' | 'Notifications', params?: Record<string, unknown>) => void;
  };
}

export function FriendsListScreen({ navigation }: FriendsListScreenProps) {
  const t = useTheme();
  const refresh = useRefresh();
  const { data: friends = [], isLoading, isError, error, refetch } = useFriends();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.screen, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={t.type.displayMd}>Friends</Text>
          <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8}>
            <Text style={[t.type.subtitle, { color: t.colors.accent }]}>Notifications</Text>
          </Pressable>
        </View>
        <Button label="Add a friend" onPress={() => navigation.navigate('AddFriend')} />
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg }}
        data={friends}
        keyExtractor={(item) => item.friendId}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          isLoading ? null : isError ? (
            <BrandEmptyState
              tone="error"
              title="Couldn’t load friends"
              body={error instanceof Error ? error.message : String(error)}
              action={{ label: 'Retry', onPress: () => refetch() }}
            />
          ) : (
            <BrandEmptyState
              title="No friends yet"
              body="Add friends by contacts sync or a shared link to see how your travel styles line up."
              action={{ label: 'Add a friend', onPress: () => navigation.navigate('AddFriend') }}
            />
          )
        }
        renderItem={({ item }) => (
          <FriendRow
            friendId={item.friendId}
            compatibilityScore={item.compatibilityScore}
            onPress={() => navigation.navigate('FriendDetail', { friendId: item.friendId })}
          />
        )}
      />
    </ScreenContainer>
  );
}

function FriendRow({
  friendId,
  compatibilityScore,
  onPress,
}: {
  friendId: string;
  compatibilityScore: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const { data: friend } = useQuery({
    queryKey: ['users', friendId],
    queryFn: () => UserRepository.getById(friendId).then(orNull),
  });
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
      }}
    >
      <ProfileIdentity name={friend?.name ?? '…'} username={friend?.username} photoUrl={friend?.profilePhotoUrl} />
      <MatchScoreBadge
        matchPercent={toMatchPercent(compatibilityScore)}
        vectorA={profile?.travelStyle}
        vectorB={friend?.travelStyle}
        detailTitle={friend?.name ?? 'Friend'}
      />
    </Pressable>
  );
}
