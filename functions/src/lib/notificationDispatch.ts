/**
 * Backs `sendNotification` (technical_specification.md §5): a Firestore
 * trigger on `notifications` create, dispatching via FCM. The four
 * notification types are exhaustive per functional_specification.md §6.5
 * — "no notification for likes or comments, since neither feature exists."
 */
import { NotificationRecord, NotificationType, PushSender } from './ports';

const NOTIFICATION_COPY: Record<
  NotificationType,
  (payload: Record<string, unknown>) => { title: string; body: string }
> = {
  trip_completed: () => ({
    title: 'Trip completed',
    body: 'A friend just completed a trip — check out their Logbook.',
  }),
  friend_added: () => ({
    title: 'New friend',
    body: 'You have a new connection on Amiva.',
  }),
  group_trip_joined: () => ({
    title: 'Group trip update',
    body: 'Someone joined a group trip you’re part of.',
  }),
  new_match: () => ({
    title: 'New match',
    body: 'A new experience strongly matches your travel style.',
  }),
};

function stringifyPayload(payload: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    result[key] = String(value);
  }
  return result;
}

export async function dispatchNotification(
  sender: PushSender,
  notification: Pick<NotificationRecord, 'notificationId' | 'recipientId' | 'type' | 'payload'>,
): Promise<void> {
  const copy = NOTIFICATION_COPY[notification.type](notification.payload);
  await sender.sendToUser(notification.recipientId, {
    title: copy.title,
    body: copy.body,
    data: {
      type: notification.type,
      notificationId: notification.notificationId,
      ...stringifyPayload(notification.payload),
    },
  });
}
