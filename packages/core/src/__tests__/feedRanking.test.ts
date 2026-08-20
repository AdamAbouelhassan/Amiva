import { computeFeedTier, FeedRankable, sortFeed } from '../feedRanking';

describe('computeFeedTier', () => {
  const HIGH = 0.7;
  it('ranks friend + high match as tier 1', () => {
    expect(computeFeedTier(true, 0.8, HIGH)).toBe(1);
  });
  it('ranks non-friend + high match as tier 2', () => {
    expect(computeFeedTier(false, 0.8, HIGH)).toBe(2);
  });
  it('ranks friend + low match as tier 3', () => {
    expect(computeFeedTier(true, 0.5, HIGH)).toBe(3);
  });
  it('ranks non-friend + low match as tier 4', () => {
    expect(computeFeedTier(false, 0.5, HIGH)).toBe(4);
  });
  it('treats a match exactly at the threshold as high match', () => {
    expect(computeFeedTier(true, HIGH, HIGH)).toBe(1);
  });
});

describe('sortFeed', () => {
  it('sorts by tier ascending, then matchScore descending, then recency descending', () => {
    const now = new Date('2026-01-10T00:00:00Z');
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

    const items: FeedRankable[] = [
      { isFriend: false, matchScore: 0.9, createdAt: daysAgo(5) }, // tier 2
      { isFriend: true, matchScore: 0.5, createdAt: daysAgo(1) }, // tier 3
      { isFriend: true, matchScore: 0.95, createdAt: daysAgo(2) }, // tier 1, newer
      { isFriend: true, matchScore: 0.8, createdAt: daysAgo(0) }, // tier 1, older-score, newest
      { isFriend: false, matchScore: 0.2, createdAt: daysAgo(10) }, // tier 4
    ];

    const sorted = sortFeed(items, 0.7);

    // Both tier-1 items come first, higher matchScore before the newer-but-lower-score one.
    expect(sorted[0]).toMatchObject({ isFriend: true, matchScore: 0.95 });
    expect(sorted[1]).toMatchObject({ isFriend: true, matchScore: 0.8 });
    // Then tier 2, tier 3, tier 4 in order.
    expect(sorted[2]).toMatchObject({ isFriend: false, matchScore: 0.9 });
    expect(sorted[3]).toMatchObject({ isFriend: true, matchScore: 0.5 });
    expect(sorted[4]).toMatchObject({ isFriend: false, matchScore: 0.2 });
  });

  it('does not mutate the input array', () => {
    const items: FeedRankable[] = [
      { isFriend: false, matchScore: 0.1, createdAt: new Date() },
      { isFriend: true, matchScore: 0.9, createdAt: new Date() },
    ];
    const original = [...items];
    sortFeed(items);
    expect(items).toEqual(original);
  });
});
