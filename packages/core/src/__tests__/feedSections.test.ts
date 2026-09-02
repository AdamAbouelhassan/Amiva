import { feedComparator } from '../feedRanking';
import { sectionByTopCategories, SectionableItem } from '../feedSections';
import { vector } from './testUtils';

interface FeedLikeItem extends SectionableItem {
  isFriend: boolean;
  matchScore: number;
  createdAt: Date;
}

describe('sectionByTopCategories', () => {
  // Viewer's top 3 (by score): culture (5), food_and_drink (4), entertainment_and_recreation (3).
  const viewer = vector({
    culture: 5,
    food_and_drink: 4,
    entertainment_and_recreation: 3,
    health_and_wellness: 2,
    natural_features: 1,
  });
  const friendSort = feedComparator(0.7);

  function item(overrides: Partial<FeedLikeItem> & { categoryScores: FeedLikeItem['categoryScores'] }): FeedLikeItem {
    return { isFriend: false, matchScore: 0.5, createdAt: new Date(), ...overrides };
  }

  it("returns exactly sectionCount sections, headed by the viewer's top categories in order", () => {
    const sections = sectionByTopCategories<FeedLikeItem>([], viewer, { sort: friendSort });
    expect(sections.map((s) => s.category)).toEqual(['culture', 'food_and_drink', 'entertainment_and_recreation']);
  });

  it('places an item in a section only if it clears the category threshold', () => {
    const museum = item({ categoryScores: vector({ culture: 5 }) });
    const cafe = item({ categoryScores: vector({ food_and_drink: 2 }) }); // below default threshold (3)

    const sections = sectionByTopCategories([museum, cafe], viewer, { sort: friendSort });
    const cultureSection = sections.find((s) => s.category === 'culture')!;
    const foodSection = sections.find((s) => s.category === 'food_and_drink')!;

    expect(cultureSection.items).toContain(museum);
    expect(foodSection.items).not.toContain(cafe);
  });

  it('allows the same item to appear in multiple sections when it scores highly across categories', () => {
    // A food tour scoring high on both Food & Drink and Culture (functional_specification.md §2.5's own example).
    const foodTour = item({ categoryScores: vector({ food_and_drink: 9, culture: 8 }) });

    const sections = sectionByTopCategories([foodTour], viewer, { sort: friendSort });
    const cultureSection = sections.find((s) => s.category === 'culture')!;
    const foodSection = sections.find((s) => s.category === 'food_and_drink')!;

    expect(cultureSection.items).toContain(foodTour);
    expect(foodSection.items).toContain(foodTour);
  });

  it('orders items within a section using the caller-supplied comparator (e.g. feedComparator for Feed)', () => {
    const now = new Date('2026-01-10T00:00:00Z');
    const lowMatchFriend = item({ categoryScores: vector({ culture: 8 }), isFriend: true, matchScore: 0.5, createdAt: now });
    const highMatchNonFriend = item({ categoryScores: vector({ culture: 8 }), isFriend: false, matchScore: 0.9, createdAt: now });

    const sections = sectionByTopCategories([lowMatchFriend, highMatchNonFriend], viewer, { sort: friendSort });
    const cultureSection = sections.find((s) => s.category === 'culture')!;

    // tier 2 (non-friend, high match) ranks above tier 3 (friend, low match).
    expect(cultureSection.items[0]).toBe(highMatchNonFriend);
    expect(cultureSection.items[1]).toBe(lowMatchFriend);
  });

  it('works with a non-Feed item shape (e.g. Trending, ranked purely by a popularity score)', () => {
    interface TrendingLikeItem extends SectionableItem {
      trendingScore: number;
    }
    const popular: TrendingLikeItem = { categoryScores: vector({ culture: 8 }), trendingScore: 0.9 };
    const niche: TrendingLikeItem = { categoryScores: vector({ culture: 8 }), trendingScore: 0.2 };

    const sections = sectionByTopCategories([niche, popular], viewer, {
      sectionCount: 1,
      sort: (a, b) => b.trendingScore - a.trendingScore,
    });

    expect(sections[0]!.items).toEqual([popular, niche]);
  });

  it('respects a custom sectionCount and categoryThreshold', () => {
    const sections = sectionByTopCategories<FeedLikeItem>([], viewer, { sectionCount: 1, sort: friendSort });
    expect(sections).toHaveLength(1);
    expect(sections[0]!.category).toBe('culture');

    const borderline = item({ categoryScores: vector({ culture: 5 }) });
    const strict = sectionByTopCategories([borderline], viewer, { sectionCount: 1, categoryThreshold: 6, sort: friendSort });
    const lenient = sectionByTopCategories([borderline], viewer, { sectionCount: 1, categoryThreshold: 5, sort: friendSort });
    expect(strict[0]!.items).toHaveLength(0);
    expect(lenient[0]!.items).toHaveLength(1);
  });

  it('returns an empty items array for a section with no qualifying items, rather than omitting the section', () => {
    const sections = sectionByTopCategories<FeedLikeItem>([], viewer, { sort: friendSort });
    expect(sections).toHaveLength(3);
    expect(sections.every((s) => Array.isArray(s.items) && s.items.length === 0)).toBe(true);
  });
});
