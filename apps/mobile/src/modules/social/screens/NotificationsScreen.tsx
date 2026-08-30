import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, Text, View } from 'react-native';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { NotificationRepository } from '../../../repositories/notificationRepository';
import { NotificationDoc } from '../../../repositories/types';
import { colors, spacing, typography } from '../../../theme';

/** Exactly the four notification types
 * (functional_specification.md §6.5) — "no notification for likes or
 * comments, since neither feature exists." */
const NOTIFICATION_COPY: Record<NotificationDoc['type'], string> = {
  trip_completed: 'A friend completed a trip.',
  friend_added: 'You have a new friend connection.',
  group_trip_joined: 'Someone joined a group trip you’re part of.',
  new_match: 'A new experience strongly matches your travel style.',
};

export function NotificationsScreen() {
  const { profile } = useCurrentUser();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications', profile?.uid],
    queryFn: () => NotificationRepository.listForRecipient(profile!.uid),
    enabled: !!profile,
  });

  async function markRead(notification: NotificationDoc) {
    if (notification.read) return;
    await NotificationRepository.markRead(notification.notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', profile?.uid] });
  }

  return (
    <ScreenContainer scroll={false}>
      <Text style={[typography.displayMd, { padding: spacing.lg, paddingBottom: 0 }]}>Notifications</Text>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        data={query.data ?? []}
        keyExtractor={(item) => item.notificationId}
        refreshing={query.isLoading}
        ListEmptyComponent={!query.isLoading ? <Text style={typography.body}>Nothing yet.</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markRead(item)}
            style={{
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              opacity: item.read ? 0.6 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={typography.body}>{NOTIFICATION_COPY[item.type]}</Text>
              {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />}
            </View>
            <Text style={typography.caption}>{item.createdAt.toLocaleString()}</Text>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
