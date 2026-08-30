import { dispatchNotification } from '../notificationDispatch';
import { PushSender } from '../ports';

describe('dispatchNotification', () => {
  it('sends the recipient a title/body derived from the notification type', async () => {
    const sent: any[] = [];
    const sender: PushSender = {
      sendToUser: async (userId, message) => {
        sent.push({ userId, message });
      },
    };

    await dispatchNotification(sender, {
      notificationId: 'n1',
      recipientId: 'sam',
      type: 'friend_added',
      payload: { friendId: 'alex' },
    });

    expect(sent).toHaveLength(1);
    expect(sent[0].userId).toBe('sam');
    expect(sent[0].message.title).toBeTruthy();
    expect(sent[0].message.data).toMatchObject({ type: 'friend_added', notificationId: 'n1', friendId: 'alex' });
  });

  it.each(['trip_completed', 'friend_added', 'group_trip_joined', 'new_match'] as const)(
    'has copy defined for every notification type (%s)',
    async (type) => {
      const sent: any[] = [];
      const sender: PushSender = { sendToUser: async (u, m) => void sent.push(m) };
      await dispatchNotification(sender, { notificationId: 'n', recipientId: 'u', type, payload: {} });
      expect(sent[0].title).toBeTruthy();
      expect(sent[0].body).toBeTruthy();
    },
  );
});
