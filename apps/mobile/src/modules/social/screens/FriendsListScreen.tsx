import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, Text, View } from 'react-native';
import { toMatchPercent } from '@amiva/core';
import { MatchBadge } from '../../../components/MatchBadge';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Button } from '../../../components/Button';
import { orNull } from '../../../lib/queryHelpers';
import { UserRepository } from '../../../repositories/userRepository';
import { colors, spacing, typography } from '../../../theme';
import { useFriends } from '../hooks/useFriends';

interface FriendsListScreenProps {
  navigation: {
    navigate: (screen: 'FriendDetail' | 'AddFriend' | 'Notifications', params?: Record<string, unknown>) => void;
  };
}

export function FriendsListScreen({ navigation }: FriendsListScreenProps) {
  const { data: friends = [], isLoading } = useFriends();

  return (
    <ScreenContainer scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={typography.displayMd}>Friends</Text>
          <Pressable onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ color: colors.accent }}>Notifications</Text>
          </Pressable>
        </View>
        <Button label="Add a friend" onPress={() => navigation.navigate('AddFriend')} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        data={friends}
        keyExtractor={(item) => item.friendId}
        refreshing={isLoading}
        ListEmptyComponent={!isLoading ? <Text style={typography.body}>No friends yet — add one to get started.</Text> : null}
        renderItem={({ item }) => (
          <FriendRow friendId={item.friendId} compatibilityScore={item.compatibilityScore} onPress={() => navigation.navigate('FriendDetail', { friendId: item.friendId })} />
        )}
      />
    </ScreenContainer>
  );
}

function FriendRow({ friendId, compatibilityScore, onPress }: { friendId: string; compatibilityScore: number; onPress: () => void }) {
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
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={typography.subtitle}>{friend?.name ?? '…'}</Text>
      <MatchBadge matchPercent={toMatchPercent(compatibilityScore)} />
    </Pressable>
  );
}
