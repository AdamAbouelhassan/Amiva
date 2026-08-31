import {
  buildPlacesQuery,
  getPlaceRecommendations,
  prettyPlaceType,
  PlaceSearchResult,
  PlacesSearchPort,
} from '../placeRecommendations';
import { FakeUserStore, vector } from './fakes';

/** Returns a canned result set per query substring, so per-category rows
 * get distinct places. Falls back to `default` for anything unmatched. */
class FakePlacesSearchPort implements PlacesSearchPort {
  calls: Array<{ query: string; type?: string }> = [];
  constructor(private byKeyword: Record<string, PlaceSearchResult[]>, private fallback: PlaceSearchResult[] = []) {}

  async textSearch(query: string, options: { type?: string }): Promise<PlaceSearchResult[]> {
    this.calls.push({ query, type: options.type });
    const hit = Object.keys(this.byKeyword).find((k) => query.includes(k));
    return hit ? this.byKeyword[hit]! : this.fallback;
  }
}

const place = (id: string, types: string[], extra: Partial<PlaceSearchResult> = {}): PlaceSearchResult => ({
  placeId: id,
  name: id,
  lat: 0,
  lng: 0,
  types,
  ...extra,
});

describe('buildPlacesQuery', () => {
  it('uses free text over a category keyword when both are given', () => {
    expect(buildPlacesQuery({ country: 'Chile', city: 'Santiago', text: 'street food', category: 'culture' })).toBe(
      'street food in Santiago, Chile',
    );
  });
  it('falls back to the category keyword when no text is given', () => {
    expect(buildPlacesQuery({ country: 'Chile', city: 'Santiago', category: 'culture' })).toBe(
      'cultural sites in Santiago, Chile',
    );
  });
  it('omits the city when none is given', () => {
    expect(buildPlacesQuery({ country: 'Chile', text: 'hiking' })).toBe('hiking in Chile');
  });
});

describe('prettyPlaceType', () => {
  it('derives a display type from the first meaningful Google type', () => {
    expect(prettyPlaceType(['night_club', 'bar', 'point_of_interest', 'establishment'])).toBe('Night club');
    expect(prettyPlaceType(['restaurant', 'food', 'establishment'])).toBe('Restaurant');
    expect(prettyPlaceType(['point_of_interest', 'establishment'])).toBeUndefined();
    expect(prettyPlaceType([])).toBeUndefined();
  });
});

describe('getPlaceRecommendations (category rows)', () => {
  const userStore = FakeUserStore.seeded({
    viewer: {
      // culture strongest, then foodie
      travelStyle: vector({ culture: 10, foodie: 8, adventure: 2 }),
      travelStyleBaseline: vector(),
      travelStyleLastUpdated: new Date(),
    },
  });

  it('returns one row per top style category, ordered by the viewer\'s interest', async () => {
    const search = new FakePlacesSearchPort({
      'cultural sites': [place('museum-1', ['museum'])],
      food: [place('resto-1', ['restaurant'])],
    });
    const rows = await getPlaceRecommendations({ placesSearch: search, userStore }, 'viewer', { country: 'Chile' }, { rows: 2 });
    expect(rows.map((r) => r.category)).toEqual(['culture', 'foodie']);
    expect(rows[0]!.items[0]!.placeId).toBe('museum-1');
    expect(rows[1]!.items[0]!.placeId).toBe('resto-1');
    expect(search.calls[0]!.type).toBe('museum');
  });

  it('shows a place in at most one row (dedup across categories)', async () => {
    const shared = [place('spot', ['museum'])];
    const search = new FakePlacesSearchPort({ 'cultural sites': shared, food: shared });
    const rows = await getPlaceRecommendations({ placesSearch: search, userStore }, 'viewer', { country: 'Chile' }, { rows: 2 });
    expect(rows.map((r) => r.category)).toEqual(['culture']); // foodie row emptied by dedup, dropped
  });

  it('collapses to a single keyword row when text is given', async () => {
    const search = new FakePlacesSearchPort({ tacos: [place('taco-1', ['restaurant'])] });
    const rows = await getPlaceRecommendations(
      { placesSearch: search, userStore },
      'viewer',
      { country: 'Mexico', text: 'tacos' },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.key).toBe('search');
    expect(rows[0]!.items[0]!.placeId).toBe('taco-1');
  });

  it('narrows a keyword search by the selected category (folds the keyword + type)', async () => {
    const search = new FakePlacesSearchPort({ 'tacos food': [place('taco-2', ['restaurant'])] });
    const rows = await getPlaceRecommendations(
      { placesSearch: search, userStore },
      'viewer',
      { country: 'Mexico', text: 'tacos', category: 'foodie' },
    );
    expect(rows[0]!.items[0]!.placeId).toBe('taco-2');
    expect(search.calls[0]!.type).toBe('restaurant');
  });

  it('shows only the selected category row when a category (no text) is set', async () => {
    const search = new FakePlacesSearchPort({ nightlife: [place('club-1', ['night_club'])] });
    const rows = await getPlaceRecommendations(
      { placesSearch: search, userStore },
      'viewer',
      { country: 'Spain', category: 'socialNightlife' },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.category).toBe('socialNightlife');
  });

  it('ranks within a row by match score and fills country/city + photos from the filter', async () => {
    const search = new FakePlacesSearchPort({
      'cultural sites': [
        place('bar', ['night_club']),
        place('museum', ['museum'], { photoReferences: ['p1'] }),
      ],
    });
    const [row] = await getPlaceRecommendations(
      { placesSearch: search, userStore },
      'viewer',
      { country: 'Chile', city: 'Santiago' },
      { rows: 1 },
    );
    expect(row!.items[0]!.placeId).toBe('museum');
    expect(row!.items[0]!.country).toBe('Chile');
    expect(row!.items[0]!.city).toBe('Santiago');
    expect(row!.items[0]!.photoReferences).toEqual(['p1']);
  });
});
