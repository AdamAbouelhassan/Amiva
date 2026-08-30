import { getTrending, TrendingCandidate, TrendingStore } from '../trending';
import { FakeUserStore, vector } from './fakes';

class FakeTrendingStore implements TrendingStore {
  constructor(private candidates: TrendingCandidate[]) {}
  async listRecentExperiences(): Promise<TrendingCandidate[]> {
    return this.candidates;
  }
}

describe('getTrending', () => {
  const now = new Date('2026-01-15T00:00:00Z');

  it('ranks a recent high-rated experience above an old low-rated one (global)', async () => {
    const trendingStore = new FakeTrendingStore([
      { experienceId: 'old-low', categoryScores: vector(), rating: 2, createdAt: new Date('2025-11-01') },
      { experienceId: 'new-high', categoryScores: vector(), rating: 5, createdAt: new Date('2026-01-14') },
    ]);
    const userStore = FakeUserStore.seeded({});

    const results = await getTrending({ trendingStore, userStore }, { type: 'global' }, now);

    expect(results[0]?.experienceId).toBe('new-high');
  });

  it('weights personalized results by the viewer match score', async () => {
    const trendingStore = new FakeTrendingStore([
      { experienceId: 'matches-viewer', categoryScores: vector({ adventure: 10 }), rating: 4, createdAt: new Date('2026-01-14') },
      { experienceId: 'off-style', categoryScores: vector({ luxury: 10 }), rating: 4, createdAt: new Date('2026-01-14') },
    ]);
    const userStore = FakeUserStore.seeded({
      viewer: { travelStyle: vector({ adventure: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: now },
    });

    const results = await getTrending(
      { trendingStore, userStore },
      { type: 'personalized', viewerId: 'viewer' },
      now,
    );

    expect(results[0]?.experienceId).toBe('matches-viewer');
    expect(results[0]?.matchScore).toBeCloseTo(1);
  });
});
