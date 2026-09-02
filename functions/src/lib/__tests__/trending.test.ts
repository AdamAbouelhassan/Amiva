import { getTrending, TrendingCandidate, TrendingStore } from '../trending';
import { FakeFriendStore, FakeUserStore, FakeVisibilityStore, vector } from './fakes';

class FakeTrendingStore implements TrendingStore {
  constructor(private candidates: TrendingCandidate[]) {}
  async listRecentExperiences(): Promise<TrendingCandidate[]> {
    return this.candidates;
  }
}

function candidate(
  overrides: Partial<TrendingCandidate> & Pick<TrendingCandidate, 'experienceId'>,
): TrendingCandidate {
  return {
    ownerId: 'someone',
    title: 'Untitled',
    city: 'Anycity',
    country: 'Anyland',
    categoryScores: vector(),
    rating: 3,
    createdAt: new Date('2026-01-14'),
    ...overrides,
  };
}

describe('getTrending (flat ranked list)', () => {
  const now = new Date('2026-01-15T00:00:00Z');
  const userStore = () =>
    FakeUserStore.seeded({
      viewer: { travelStyle: vector({ entertainment_and_recreation: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: now },
    });
  const deps = (trendingStore: TrendingStore, visibilityStore: FakeVisibilityStore, friendStore = new FakeFriendStore()) => ({
    trendingStore,
    userStore: userStore(),
    friendStore,
    visibilityStore,
  });

  it('ranks a recent high-rated experience above an old low-rated one, as one flat list', async () => {
    const store = new FakeTrendingStore([
      candidate({ experienceId: 'old-low', ownerId: 'a', rating: 2, createdAt: new Date('2025-11-01') }),
      candidate({ experienceId: 'new-high', ownerId: 'b', rating: 5, createdAt: new Date('2026-01-14') }),
    ]);
    const result = await getTrending(
      deps(store, FakeVisibilityStore.seeded({ a: 'public', b: 'public' })),
      'viewer',
      now,
    );
    expect(result.map((i) => i.experienceId)).toEqual(['new-high', 'old-low']);
  });

  it('includes each card\'s viewer match score without letting it drive the ranking', async () => {
    const store = new FakeTrendingStore([
      candidate({ experienceId: 'on-style', ownerId: 'a', categoryScores: vector({ entertainment_and_recreation: 10 }), rating: 4 }),
    ]);
    const [item] = await getTrending(deps(store, FakeVisibilityStore.seeded({ a: 'public' })), 'viewer', now);
    expect(item!.matchScore).toBeCloseTo(1);
  });

  it("excludes a private owner's experience", async () => {
    const store = new FakeTrendingStore([
      candidate({ experienceId: 'private-post', ownerId: 'a', rating: 5, createdAt: new Date('2026-01-14') }),
    ]);
    const result = await getTrending(deps(store, FakeVisibilityStore.seeded({ a: 'private' })), 'viewer', now);
    expect(result).toHaveLength(0);
  });

  it("includes a friends-only owner's experience only when the viewer is their friend", async () => {
    const store = new FakeTrendingStore([candidate({ experienceId: 'fo', ownerId: 'a', rating: 5 })]);
    const vis = FakeVisibilityStore.seeded({ a: 'friends' });

    expect(await getTrending(deps(store, vis), 'viewer', now)).toHaveLength(0);

    const friendStore = new FakeFriendStore();
    await friendStore.createFriendEdgePair({ userId: 'viewer', friendId: 'a', compatibilityScore: 0.5, addedVia: 'qr_link', createdAt: now });
    expect(await getTrending(deps(store, vis, friendStore), 'viewer', now)).toHaveLength(1);
  });

  it('respects the limit', async () => {
    const store = new FakeTrendingStore(
      Array.from({ length: 10 }, (_, i) => candidate({ experienceId: `e${i}`, ownerId: 'a' })),
    );
    const result = await getTrending(deps(store, FakeVisibilityStore.seeded({ a: 'public' })), 'viewer', now, 3);
    expect(result).toHaveLength(3);
  });
});
