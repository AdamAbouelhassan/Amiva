import { getTrending, TrendingCandidate, TrendingStore } from '../trending';
import { FakeFriendStore, FakeUserStore, FakeVisibilityStore, vector } from './fakes';

class FakeTrendingStore implements TrendingStore {
  constructor(private candidates: TrendingCandidate[]) {}
  async listRecentExperiences(): Promise<TrendingCandidate[]> {
    return this.candidates;
  }
}

function candidate(overrides: Partial<TrendingCandidate> & Pick<TrendingCandidate, 'experienceId'>): TrendingCandidate {
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

describe('getTrending', () => {
  const now = new Date('2026-01-15T00:00:00Z');
  // The viewer always needs a travel style on file (used for section
  // headers regardless of scope) and, since 'viewer' owns nothing here, is
  // never itself a candidate.
  const userStore = () =>
    FakeUserStore.seeded({
      viewer: { travelStyle: vector({ adventure: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: now },
    });

  it('ranks a recent high-rated experience above an old low-rated one (global)', async () => {
    const trendingStore = new FakeTrendingStore([
      candidate({ experienceId: 'old-low', ownerId: 'a', categoryScores: vector({ adventure: 10 }), rating: 2, createdAt: new Date('2025-11-01') }),
      candidate({ experienceId: 'new-high', ownerId: 'b', categoryScores: vector({ adventure: 10 }), rating: 5, createdAt: new Date('2026-01-14') }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({ a: 'public', b: 'public' });

    const sections = await getTrending(
      { trendingStore, userStore: userStore(), friendStore: new FakeFriendStore(), visibilityStore },
      'viewer',
      { type: 'global' },
      {},
      now,
    );

    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items[0]?.experienceId).toBe('new-high');
  });

  it('weights personalized results by the viewer match score', async () => {
    const trendingStore = new FakeTrendingStore([
      candidate({ experienceId: 'matches-viewer', ownerId: 'a', categoryScores: vector({ adventure: 10 }), rating: 4, createdAt: new Date('2026-01-14') }),
      candidate({ experienceId: 'off-style', ownerId: 'b', categoryScores: vector({ luxury: 10 }), rating: 4, createdAt: new Date('2026-01-14') }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({ a: 'public', b: 'public' });

    const sections = await getTrending(
      { trendingStore, userStore: userStore(), friendStore: new FakeFriendStore(), visibilityStore },
      'viewer',
      { type: 'personalized' },
      {},
      now,
    );

    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items[0]?.experienceId).toBe('matches-viewer');
    expect(adventureSection.items[0]?.matchScore).toBeCloseTo(1);
  });

  it('excludes a private owner\'s experience even though it would otherwise rank highly', async () => {
    const trendingStore = new FakeTrendingStore([
      candidate({ experienceId: 'private-post', ownerId: 'a', categoryScores: vector({ adventure: 10 }), rating: 5, createdAt: new Date('2026-01-14') }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({ a: 'private' });

    const sections = await getTrending(
      { trendingStore, userStore: userStore(), friendStore: new FakeFriendStore(), visibilityStore },
      'viewer',
      { type: 'global' },
      {},
      now,
    );

    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items).toHaveLength(0);
  });

  it('includes a friends-only owner\'s experience only when the viewer is actually their friend', async () => {
    const trendingStore = new FakeTrendingStore([
      candidate({ experienceId: 'friends-only-post', ownerId: 'a', categoryScores: vector({ adventure: 10 }), rating: 5, createdAt: new Date('2026-01-14') }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({ a: 'friends' });

    const withoutFriendship = await getTrending(
      { trendingStore, userStore: userStore(), friendStore: new FakeFriendStore(), visibilityStore },
      'viewer',
      { type: 'global' },
      {},
      now,
    );
    expect(withoutFriendship.find((s) => s.category === 'adventure')!.items).toHaveLength(0);

    const friendStore = new FakeFriendStore();
    await friendStore.createFriendEdgePair({ userId: 'viewer', friendId: 'a', compatibilityScore: 0.5, addedVia: 'qr_link', createdAt: now });

    const withFriendship = await getTrending(
      { trendingStore, userStore: userStore(), friendStore, visibilityStore },
      'viewer',
      { type: 'global' },
      {},
      now,
    );
    expect(withFriendship.find((s) => s.category === 'adventure')!.items).toHaveLength(1);
  });

  it('filters by free text on title', async () => {
    const trendingStore = new FakeTrendingStore([
      candidate({ experienceId: 'a', ownerId: 'owner', title: 'Hiking Torres del Paine', categoryScores: vector({ adventure: 10 }) }),
      candidate({ experienceId: 'b', ownerId: 'owner', title: 'Museum tour', categoryScores: vector({ adventure: 10 }) }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({ owner: 'public' });

    const sections = await getTrending(
      { trendingStore, userStore: userStore(), friendStore: new FakeFriendStore(), visibilityStore },
      'viewer',
      { type: 'global' },
      { text: 'hiking' },
      now,
    );

    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.map((i) => i.experienceId)).toEqual(['a']);
  });

  it('filters by country (case-insensitively), folded in as another filter rather than a separate scope', async () => {
    const trendingStore = new FakeTrendingStore([
      candidate({ experienceId: 'a', ownerId: 'owner', country: 'Chile', categoryScores: vector({ adventure: 10 }) }),
      candidate({ experienceId: 'b', ownerId: 'owner', country: 'France', categoryScores: vector({ adventure: 10 }) }),
    ]);
    const visibilityStore = FakeVisibilityStore.seeded({ owner: 'public' });

    const sections = await getTrending(
      { trendingStore, userStore: userStore(), friendStore: new FakeFriendStore(), visibilityStore },
      'viewer',
      { type: 'global' },
      { country: 'chile' },
      now,
    );

    const adventureSection = sections.find((s) => s.category === 'adventure')!;
    expect(adventureSection.items.map((i) => i.experienceId)).toEqual(['a']);
  });
});
