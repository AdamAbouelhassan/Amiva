import { vector } from './fakes';
import {
  ConversionDecision,
  convertPlannedTripToLogbook,
  PlannedTripConversionStore,
  PlannedTripItemRecord,
  PlannedTripRecord,
} from '../plannedTripConversion';

class FakePlannedTripConversionStore implements PlannedTripConversionStore {
  createdExperiences: Array<{ ownerId: string; tripId?: string; itemId: string }> = [];
  convertedItems: Array<{ itemId: string; experienceId: string }> = [];
  private trip: PlannedTripRecord;
  private items: Map<string, PlannedTripItemRecord>;
  private tripsByCountry = new Map<string, string>();

  constructor(trip: PlannedTripRecord, items: PlannedTripItemRecord[]) {
    this.trip = trip;
    this.items = new Map(items.map((i) => [i.itemId, i]));
  }

  async getPlannedTrip(): Promise<PlannedTripRecord> {
    return this.trip;
  }

  async getPlannedTripItem(itemId: string): Promise<PlannedTripItemRecord> {
    const item = this.items.get(itemId);
    if (!item) throw new Error('not found');
    return item;
  }

  async findOrCreateTripForCountry(ownerId: string, country: string): Promise<string> {
    const existing = this.tripsByCountry.get(country);
    if (existing) return existing;
    const tripId = `trip-${country}`;
    this.tripsByCountry.set(country, tripId);
    return tripId;
  }

  async createExperience(ownerId: string, tripId: string | undefined, item: PlannedTripItemRecord): Promise<string> {
    const experienceId = `exp-${item.itemId}`;
    this.createdExperiences.push({ ownerId, tripId, itemId: item.itemId });
    return experienceId;
  }

  async markItemConverted(itemId: string, experienceId: string): Promise<void> {
    this.convertedItems.push({ itemId, experienceId });
  }
}

describe('convertPlannedTripToLogbook', () => {
  const trip: PlannedTripRecord = {
    plannedTripId: 'planned-1',
    ownerId: 'alex',
    locations: ['Japan'],
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-03-10'),
  };
  const items: PlannedTripItemRecord[] = [
    { itemId: 'item-1', plannedTripId: 'planned-1', placeId: 'p1', title: 'Ramen shop' },
    { itemId: 'item-2', plannedTripId: 'planned-1', placeId: 'p2', title: 'Temple' },
  ];

  it('converts selected items into logbook experiences under a shared trip, and leaves skipped items alone', async () => {
    const store = new FakePlannedTripConversionStore(trip, items);
    const decisions: ConversionDecision[] = [
      {
        itemId: 'item-1',
        action: 'convert',
        details: {
          photoUrls: ['https://p/1.jpg'],
          rating: 5,
          notes: 'great ramen',
          categoryScores: vector({ foodie: 9 }),
          date: new Date('2026-03-02'),
          dateSource: 'manual',
        },
      },
      { itemId: 'item-2', action: 'skip' },
    ];

    const summary = await convertPlannedTripToLogbook(store, 'planned-1', decisions);

    expect(summary.converted).toEqual(['item-1']);
    expect(summary.skipped).toEqual(['item-2']);
    expect(store.createdExperiences).toEqual([{ ownerId: 'alex', tripId: 'trip-Japan', itemId: 'item-1' }]);
    expect(store.convertedItems).toEqual([{ itemId: 'item-1', experienceId: 'exp-item-1' }]);
  });

  it('reuses the same trip for multiple converted items from the same planned trip', async () => {
    const store = new FakePlannedTripConversionStore(trip, items);
    const decisions: ConversionDecision[] = items.map((item) => ({
      itemId: item.itemId,
      action: 'convert' as const,
      details: {
        photoUrls: [],
        rating: 4,
        notes: '',
        categoryScores: vector(),
        date: new Date('2026-03-05'),
        dateSource: 'manual' as const,
      },
    }));

    await convertPlannedTripToLogbook(store, 'planned-1', decisions);

    const tripIds = new Set(store.createdExperiences.map((e) => e.tripId));
    expect(tripIds.size).toBe(1);
  });
});
