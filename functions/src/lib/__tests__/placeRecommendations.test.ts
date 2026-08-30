import { buildPlacesQuery, getPlaceRecommendations, PlaceSearchResult, PlacesSearchPort } from '../placeRecommendations';
import { FakeUserStore, vector } from './fakes';

class FakePlacesSearchPort implements PlacesSearchPort {
  lastQuery?: string;
  lastType?: string;
  constructor(private results: PlaceSearchResult[]) {}

  async textSearch(query: string, options: { type?: string }): Promise<PlaceSearchResult[]> {
    this.lastQuery = query;
    this.lastType = options.type;
    return this.results;
  }
}

describe('buildPlacesQuery', () => {
  it('uses free text over a category keyword when both are given', () => {
    expect(buildPlacesQuery({ country: 'Chile', city: 'Santiago', text: 'street food', category: 'culture' })).toBe(
      'street food in Santiago, Chile',
    );
  });

  it('falls back to the category keyword when no text is given', () => {
    expect(buildPlacesQuery({ country: 'Chile', city: 'Santiago', category: 'culture' })).toBe('cultural sites in Santiago, Chile');
  });

  it('falls back to a generic subject when neither text nor category is given', () => {
    expect(buildPlacesQuery({ country: 'Chile', city: 'Santiago' })).toBe('things to do in Santiago, Chile');
  });

  it('omits the city when none is given', () => {
    expect(buildPlacesQuery({ country: 'Chile', text: 'hiking' })).toBe('hiking in Chile');
  });
});

describe('getPlaceRecommendations', () => {
  const userStore = FakeUserStore.seeded({
    viewer: { travelStyle: vector({ culture: 10 }), travelStyleBaseline: vector(), travelStyleLastUpdated: new Date() },
  });

  it('scores each result against the viewer and sorts by match score descending', async () => {
    const placesSearch = new FakePlacesSearchPort([
      { placeId: 'bar-1', name: 'Loud Bar', lat: 0, lng: 0, types: ['night_club'] }, // socialNightlife, off-style
      { placeId: 'museum-1', name: 'City Museum', lat: 0, lng: 0, types: ['museum'] }, // culture, on-style
    ]);

    const results = await getPlaceRecommendations({ placesSearch, userStore }, 'viewer', { country: 'Chile', city: 'Santiago' });

    expect(results[0]?.placeId).toBe('museum-1');
    expect(results[0]?.matchScore).toBeGreaterThan(results[1]!.matchScore);
  });

  it('fills in country/city on results from the filter, not from Places (Text Search has no structured address)', async () => {
    const placesSearch = new FakePlacesSearchPort([{ placeId: 'museum-1', name: 'City Museum', lat: 1, lng: 2, types: ['museum'] }]);

    const [result] = await getPlaceRecommendations({ placesSearch, userStore }, 'viewer', { country: 'Chile', city: 'Santiago' });

    expect(result!.country).toBe('Chile');
    expect(result!.city).toBe('Santiago');
  });

  it("passes the category's representative Google type through to the search port", async () => {
    const placesSearch = new FakePlacesSearchPort([]);
    await getPlaceRecommendations({ placesSearch, userStore }, 'viewer', { country: 'Chile', category: 'foodie' });
    expect(placesSearch.lastType).toBe('restaurant');
  });

  it('respects the limit after sorting', async () => {
    const placesSearch = new FakePlacesSearchPort([
      { placeId: 'a', name: 'A', lat: 0, lng: 0, types: ['museum'] },
      { placeId: 'b', name: 'B', lat: 0, lng: 0, types: ['museum'] },
      { placeId: 'c', name: 'C', lat: 0, lng: 0, types: ['museum'] },
    ]);
    const results = await getPlaceRecommendations({ placesSearch, userStore }, 'viewer', { country: 'Chile' }, 2);
    expect(results).toHaveLength(2);
  });
});
