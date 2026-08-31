import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { BrandEmptyState } from '../../../components/BrandEmptyState';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { NotificationIcon } from '../../../components/icons/NotificationIcon';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useRefresh } from '../../../hooks/useRefresh';
import { NotificationRepository } from '../../../repositories/notificationRepository';
import { NotificationDoc } from '../../../repositories/types';
import { spacing, useTheme } from '../../../theme';

/** Exactly the four notification types (functional_specification.md §6.5). */
const NOTIFICATION_COPY: Record<NotificationDoc['type'], string> = {
  trip_completed: 'A friend completed a trip.',
  friend_added: 'You have a new friend connection.',
  group_trip_joined: 'Someone joined a group trip you’re part of.',
  new_match: 'A new experience strongly matches your travel style.',
};

export function NotificationsScreen() {
  const t = useTheme();
  const { profile } = useCurrentUser();
  const queryClient = useQueryClient();
  const refresh = useRefresh();
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
      <Text style={[t.type.displayMd, { padding: spacing.screen, paddingBottom: spacing.xs }]}>Notifications</Text>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingTop: 0, gap: spacing.xs }}
        data={query.data ?? []}
        keyExtractor={(item) => item.notificationId}
        refreshControl={
          <RefreshControl
            refreshing={refresh.refreshing}
            onRefresh={refresh.onRefresh}
            tintColor={t.colors.accent}
            colors={[t.colors.accent]}
          />
        }
        ListEmptyComponent={
          !query.isLoading ? (
            <BrandEmptyState
              title="Nothing yet"
              body="Trip completions, new friends, group joins, and strong new matches land here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markRead(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: t.colors.border,
              opacity: item.read ? 0.55 : 1,
            }}
          >
            <NotificationIcon type={item.type} size={30} />
            <View style={{ flex: 1 }}>
              <Text style={t.type.body}>{NOTIFICATION_COPY[item.type]}</Text>
              <Text style={t.type.caption}>{item.createdAt.toLocaleString()}</Text>
            </View>
            {!item.read && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
            )}
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
