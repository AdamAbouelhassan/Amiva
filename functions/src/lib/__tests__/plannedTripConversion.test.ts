import {
  convertPlannedTripToLogbook,
  CreateLogbookTripInput,
  PlannedTripConversionStore,
  PlannedTripRecord,
} from '../plannedTripConversion';

class FakeStore implements PlannedTripConversionStore {
  created: CreateLogbookTripInput[] = [];
  completed: Array<{ plannedTripId: string; tripId: string }> = [];
  constructor(private readonly plan: PlannedTripRecord) {}

  async getPlannedTrip() {
    return this.plan;
  }
  async createTripForPlannedTrip(_ownerId: string, input: CreateLogbookTripInput) {
    this.created.push(input);
    return `trip-${this.created.length}`;
  }
  async markPlannedTripCompleted(plannedTripId: string, tripId: string) {
    this.completed.push({ plannedTripId, tripId });
  }
}

const plan: PlannedTripRecord = {
  plannedTripId: 'p1',
  ownerId: 'alex',
  name: 'Japan spring',
  location: 'Tokyo, Japan',
  country: 'Japan',
  city: 'Tokyo',
  notes: 'cherry blossoms',
  accommodation: 'hostel',
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-10'),
  visibility: 'friends',
};

describe('convertPlannedTripToLogbook', () => {
  it('creates one Logbook trip mirroring the plan + photos, and links it', async () => {
    const store = new FakeStore(plan);
    const { tripId } = await convertPlannedTripToLogbook(store, 'p1', ['a.jpg', 'b.jpg']);

    expect(tripId).toBe('trip-1');
    expect(store.created).toHaveLength(1);
    expect(store.created[0]).toMatchObject({
      name: 'Japan spring',
      location: 'Tokyo, Japan',
      country: 'Japan',
      city: 'Tokyo',
      notes: 'cherry blossoms',
      accommodation: 'hostel',
      visibility: 'friends',
      photoUrls: ['a.jpg', 'b.jpg'],
    });
    expect(store.completed).toEqual([{ plannedTripId: 'p1', tripId: 'trip-1' }]);
  });

  it('falls back to a generated name when the plan has none', async () => {
    const store = new FakeStore({ ...plan, name: '   ' });
    await convertPlannedTripToLogbook(store, 'p1', []);
    expect(store.created[0]!.name).toBe('Tokyo, Japan — Mar 1–10');
  });

  it('works with no photos', async () => {
    const store = new FakeStore(plan);
    await convertPlannedTripToLogbook(store, 'p1', []);
    expect(store.created[0]!.photoUrls).toEqual([]);
  });
});
