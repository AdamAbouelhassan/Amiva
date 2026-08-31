import {
  revertCompletedTrip,
  RevertCompletedTripStore,
  RevertPlannedTripRecord,
} from '../revertCompletedTrip';

class FakeStore implements RevertCompletedTripStore {
  detached: string[] = [];
  deleted: string[] = [];
  restored: string[] = [];
  constructor(
    private readonly plan: RevertPlannedTripRecord,
    private readonly attachedExperiences = 0,
  ) {}

  async getPlannedTrip() {
    return this.plan;
  }
  async detachExperiences(tripId: string) {
    this.detached.push(tripId);
    return this.attachedExperiences;
  }
  async deleteTrip(tripId: string) {
    this.deleted.push(tripId);
  }
  async restorePlannedTrip(plannedTripId: string) {
    this.restored.push(plannedTripId);
  }
}

describe('revertCompletedTrip', () => {
  it('detaches experiences, deletes the Logbook trip, and restores the plan', async () => {
    const store = new FakeStore(
      { plannedTripId: 'p1', ownerId: 'alex', status: 'completed', convertedToTripId: 't9' },
      3,
    );
    const result = await revertCompletedTrip(store, 'p1');

    expect(store.detached).toEqual(['t9']);
    expect(store.deleted).toEqual(['t9']);
    expect(store.restored).toEqual(['p1']);
    expect(result.detachedExperiences).toBe(3);
  });

  it('still restores the plan when no Logbook trip was linked', async () => {
    const store = new FakeStore({ plannedTripId: 'p1', ownerId: 'alex', status: 'completed' });
    await revertCompletedTrip(store, 'p1');
    expect(store.deleted).toEqual([]);
    expect(store.restored).toEqual(['p1']);
  });

  it('rejects a plan that is not completed', async () => {
    const store = new FakeStore({ plannedTripId: 'p1', ownerId: 'alex', status: 'planning' });
    await expect(revertCompletedTrip(store, 'p1')).rejects.toThrow(/not completed/);
  });
});
