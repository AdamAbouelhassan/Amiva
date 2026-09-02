import { FriendStore, NotificationStore, UserStore } from '../ports';
import { addFriend, recomputeCompatibilityForAllFriends } from '../friendCompatibility';
import { combineStores, FakeFriendStore, FakeNotificationStore, FakeUserStore, vector } from './fakes';

describe('addFriend', () => {
  it('creates a bidirectional edge with a cached compatibility score', async () => {
    const userStore = FakeUserStore.seeded({
      alex: { travelStyle: vector({ entertainment_and_recreation: 8 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
      sam: { travelStyle: vector({ entertainment_and_recreation: 8 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
    });
    const friendStore = new FakeFriendStore();
    const notificationStore = new FakeNotificationStore();
    const store = combineStores<UserStore & FriendStore & NotificationStore>(
      userStore,
      friendStore,
      notificationStore,
    );

    const result = await addFriend(store, {
      initiatorId: 'alex',
      friendId: 'sam',
      addedVia: 'qr_link',
      now: new Date('2026-01-01'),
    });

    expect(result.compatibilityScore).toBeCloseTo(1);
    expect(friendStore.edges).toHaveLength(2);
    expect(friendStore.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'alex', friendId: 'sam' }),
        expect.objectContaining({ userId: 'sam', friendId: 'alex' }),
      ]),
    );
  });

  it('notifies the other party, not the initiator', async () => {
    const userStore = FakeUserStore.seeded({
      alex: { travelStyle: vector(), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
      sam: { travelStyle: vector(), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
    });
    const friendStore = new FakeFriendStore();
    const notificationStore = new FakeNotificationStore();
    const store = combineStores<UserStore & FriendStore & NotificationStore>(
      userStore,
      friendStore,
      notificationStore,
    );

    await addFriend(store, { initiatorId: 'alex', friendId: 'sam', addedVia: 'contacts_sync', now: new Date() });

    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0]).toMatchObject({ recipientId: 'sam', type: 'friend_added' });
  });
});

describe('recomputeCompatibilityForAllFriends', () => {
  it('recomputes and updates both directions of every friend edge', async () => {
    const userStore = FakeUserStore.seeded({
      alex: {
        travelStyle: vector({ entertainment_and_recreation: 10 }),
        travelStyleBaseline: vector(),
        travelStyleLastUpdated: new Date(),
      },
      sam: {
        travelStyle: vector({ entertainment_and_recreation: 0, sports: 10 }),
        travelStyleBaseline: vector(),
        travelStyleLastUpdated: new Date(),
      },
    });
    const friendStore = new FakeFriendStore();
    await friendStore.createFriendEdgePair({
      userId: 'alex',
      friendId: 'sam',
      compatibilityScore: 0.5, // stale
      addedVia: 'qr_link',
      createdAt: new Date(),
    });
    const store = combineStores<UserStore & FriendStore>(userStore, friendStore);

    await recomputeCompatibilityForAllFriends(store, 'alex');

    const alexToSam = friendStore.edges.find((e) => e.userId === 'alex' && e.friendId === 'sam')!;
    const samToAlex = friendStore.edges.find((e) => e.userId === 'sam' && e.friendId === 'alex')!;
    expect(alexToSam.compatibilityScore).toBeCloseTo(0);
    expect(samToAlex.compatibilityScore).toBeCloseTo(0);
  });
});
