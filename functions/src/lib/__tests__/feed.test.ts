import { FeedCandidate, FeedStore, getFeed } from '../feed';
import { FakeFriendStore, FakeUserStore, FakeVisibilityStore, vector } from './fakes';

class FakeFeedStore implements FeedStore {
  constructor(private byOwner: FeedCandidate[], private recent: FeedCandidate[]) {}

  async listByOwners(ownerIds: string[]): Promise<FeedCandidate[]> {
    return this.byOwner.filter((c) => ownerIds.includes(c.ownerId));
  }

  async listRecent(): Promise<FeedCandidate[]> {
    return this.recent;
  }
}

function candidate(overrides: Partial<FeedCandidate> & Pick<FeedCandidate, 'experienceId' | 'ownerId'>): FeedCandidate {
  return {
    title: 'Untitled',
    city: 'Anycity',
    country: 'Anyland',
    categoryScores: vector(),
    createdAt: new Date('2026-01-14'),
    ...overrides,
  };
}

describe('getFeed', () => {
  const userStore = () =>
    FakeUserStore.seeded({
      viewer: { travelStyle: vector({ adventure: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
    });

  async function friendsWith(...friendIds: string[]): Promise<FakeFriendStore> {
    const store = new FakeFriendStore();
    for (const friendId of friendIds) {
      await store.createFriendEdgePair({ userId: 'viewer', friendId, compatibilityScore: 0.5, addedVia: 'qr_link', createdAt: new Date() });
    }
    return store;
  }

  it("includes a friend's public experience", async () => {
    const feedStore = new FakeFeedStore(
      [candidate({ experienceId: 'friend-post', ownerId: 'friend-1', categoryScores: vector({ adventure: 10 }) })],
      [],
    );
    const sections = await getFeed(
      {
        feedStore,
        friendStore: await friendsWith('friend-1'),
        userStore: userStore(),
        visibilityStore: FakeVisibilityStore.seeded({ 'friend-1': 'public' }),
      },
      'viewer',
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.map((i) => i.experienceId)).toContain('friend-post');
    expect(adventureSection.items.find((i) => i.experienceId === 'friend-post')?.isFriend).toBe(true);
  });

  it("excludes a friend's private experience even with a real friend edge", async () => {
    const feedStore = new FakeFeedStore(
      [candidate({ experienceId: 'friend-private', ownerId: 'friend-1', categoryScores: vector({ adventure: 10 }) })],
      [],
    );
    const sections = await getFeed(
      {
        feedStore,
        friendStore: await friendsWith('friend-1'),
        userStore: userStore(),
        visibilityStore: FakeVisibilityStore.seeded({ 'friend-1': 'private' }),
      },
      'viewer',
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.map((i) => i.experienceId)).not.toContain('friend-private');
  });

  it('falls back to a high-match non-friend post when friends have nothing in that section', async () => {
    const feedStore = new FakeFeedStore(
      [],
      [candidate({ experienceId: 'stranger-high-match', ownerId: 'stranger-1', categoryScores: vector({ adventure: 10 }) })],
    );
    const sections = await getFeed(
      {
        feedStore,
        friendStore: new FakeFriendStore(),
        userStore: userStore(),
        visibilityStore: FakeVisibilityStore.seeded({ 'stranger-1': 'public' }),
      },
      'viewer',
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.map((i) => i.experienceId)).toContain('stranger-high-match');
    expect(adventureSection.items.find((i) => i.experienceId === 'stranger-high-match')?.isFriend).toBe(false);
  });

  it('excludes a non-friend private/friends-only stranger from the fallback pool', async () => {
    const feedStore = new FakeFeedStore(
      [],
      [
        candidate({ experienceId: 'private-stranger', ownerId: 'stranger-1', categoryScores: vector({ adventure: 10 }) }),
        candidate({ experienceId: 'friends-only-stranger', ownerId: 'stranger-2', categoryScores: vector({ adventure: 10 }) }),
      ],
    );
    const sections = await getFeed(
      {
        feedStore,
        friendStore: new FakeFriendStore(),
        userStore: userStore(),
        visibilityStore: FakeVisibilityStore.seeded({ 'stranger-1': 'private', 'stranger-2': 'friends' }),
      },
      'viewer',
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items).toHaveLength(0);
  });

  it('never includes the viewer\'s own experiences', async () => {
    const feedStore = new FakeFeedStore(
      [],
      [candidate({ experienceId: 'own-post', ownerId: 'viewer', categoryScores: vector({ adventure: 10 }) })],
    );
    const sections = await getFeed(
      { feedStore, friendStore: new FakeFriendStore(), userStore: userStore(), visibilityStore: FakeVisibilityStore.seeded({ viewer: 'public' }) },
      'viewer',
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items).toHaveLength(0);
  });

  it('does not double-count a friend\'s post that also appears in the broader fallback pool', async () => {
    const friendPost = candidate({ experienceId: 'friend-post', ownerId: 'friend-1', categoryScores: vector({ adventure: 10 }) });
    const feedStore = new FakeFeedStore([friendPost], [friendPost]);
    const sections = await getFeed(
      {
        feedStore,
        friendStore: await friendsWith('friend-1'),
        userStore: userStore(),
        visibilityStore: FakeVisibilityStore.seeded({ 'friend-1': 'public' }),
      },
      'viewer',
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.filter((i) => i.experienceId === 'friend-post')).toHaveLength(1);
  });

  it('applies text/country/city filters', async () => {
    const feedStore = new FakeFeedStore(
      [],
      [
        candidate({ experienceId: 'match', ownerId: 'stranger-1', title: 'Hiking Torres del Paine', city: 'Puerto Natales', country: 'Chile', categoryScores: vector({ adventure: 10 }) }),
        candidate({ experienceId: 'no-match', ownerId: 'stranger-2', title: 'Museum tour', city: 'Paris', country: 'France', categoryScores: vector({ adventure: 10 }) }),
      ],
    );
    const sections = await getFeed(
      {
        feedStore,
        friendStore: new FakeFriendStore(),
        userStore: userStore(),
        visibilityStore: FakeVisibilityStore.seeded({ 'stranger-1': 'public', 'stranger-2': 'public' }),
      },
      'viewer',
      { text: 'hiking', country: 'chile' },
    );
    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.map((i) => i.experienceId)).toEqual(['match']);
  });
});
