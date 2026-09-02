import {
  addPlannedTripToLogbook,
  CreateLogbookTripInput,
  PlannedTripConversionStore,
  PlannedTripRecord,
} from '../plannedTripConversion';

class FakeStore implements PlannedTripConversionStore {
  created: Array<{ userId: string; input: CreateLogbookTripInput }> = [];
  recorded: Array<{ plannedTripId: string; userId: string; tripId: string; markCompleted: boolean }> = [];
  constructor(private plan: PlannedTripRecord) {}

  async getPlannedTrip() {
    return this.plan;
  }
  async createTripForUser(userId: string, input: CreateLogbookTripInput) {
    this.created.push({ userId, input });
    return `trip-${this.created.length}`;
  }
  async recordLoggedTrip(plannedTripId: string, userId: string, tripId: string, markCompleted: boolean) {
    this.recorded.push({ plannedTripId, userId, tripId, markCompleted });
    this.plan = { ...this.plan, loggedTripIds: { ...this.plan.loggedTripIds, [userId]: tripId } };
  }
}

const basePlan: PlannedTripRecord = {
  plannedTripId: 'p1',
  ownerId: 'alex',
  collaboratorIds: ['sam'],
  name: 'Japan spring',
  location: 'Tokyo, Japan',
  country: 'Japan',
  city: 'Tokyo',
  notes: 'cherry blossoms',
  accommodation: 'hostel',
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-10'),
  visibility: 'friends',
  loggedTripIds: {},
};

const afterEnd = new Date('2026-03-12');

describe('addPlannedTripToLogbook', () => {
  it('creates a Logbook trip owned by the caller, mirroring the plan + photos', async () => {
    const store = new FakeStore({ ...basePlan });
    const { tripId } = await addPlannedTripToLogbook(store, 'p1', 'alex', ['a.jpg', 'b.jpg'], afterEnd);

    expect(tripId).toBe('trip-1');
    expect(store.created[0]!.userId).toBe('alex');
    expect(store.created[0]!.input).toMatchObject({
      name: 'Japan spring',
      location: 'Tokyo, Japan',
      country: 'Japan',
      city: 'Tokyo',
      visibility: 'friends',
      photoUrls: ['a.jpg', 'b.jpg'],
    });
    expect(store.recorded).toEqual([
      { plannedTripId: 'p1', userId: 'alex', tripId: 'trip-1', markCompleted: true },
    ]);
  });

  it('a collaborator gets a separate copy; not marked completed again', async () => {
    const store = new FakeStore({ ...basePlan, loggedTripIds: { alex: 'trip-alex' } });
    const { tripId } = await addPlannedTripToLogbook(store, 'p1', 'sam', ['s.jpg'], afterEnd);
    expect(tripId).toBe('trip-1');
    expect(store.created[0]!.userId).toBe('sam');
    expect(store.recorded[0]!.markCompleted).toBe(false);
  });

  it('is idempotent — returns the existing trip id', async () => {
    const store = new FakeStore({ ...basePlan, loggedTripIds: { alex: 'trip-alex' } });
    const { tripId } = await addPlannedTripToLogbook(store, 'p1', 'alex', [], afterEnd);
    expect(tripId).toBe('trip-alex');
    expect(store.created).toHaveLength(0);
  });

  it('rejects a non-participant', async () => {
    const store = new FakeStore({ ...basePlan });
    await expect(addPlannedTripToLogbook(store, 'p1', 'stranger', [], afterEnd)).rejects.toThrow();
  });

  it('rejects before the trip has ended', async () => {
    const store = new FakeStore({ ...basePlan });
    await expect(
      addPlannedTripToLogbook(store, 'p1', 'alex', [], new Date('2026-03-05')),
    ).rejects.toThrow();
  });

  it('falls back to a generated name when the plan has none', async () => {
    const store = new FakeStore({ ...basePlan, name: '   ' });
    await addPlannedTripToLogbook(store, 'p1', 'alex', [], afterEnd);
    expect(store.created[0]!.input.name).toBe('Tokyo, Japan — Mar 1–10');
  });
});
