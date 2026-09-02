import {
  removePlannedTripFromLogbook,
  RevertCompletedTripStore,
  RevertPlannedTripRecord,
} from '../revertCompletedTrip';

class FakeStore implements RevertCompletedTripStore {
  detached: string[] = [];
  deleted: string[] = [];
  removed: Array<{ userId: string; restoreToPlanning: boolean }> = [];
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
  async removeLoggedTrip(_plannedTripId: string, userId: string, restoreToPlanning: boolean) {
    this.removed.push({ userId, restoreToPlanning });
  }
}

describe('removePlannedTripFromLogbook', () => {
  it('removes only the caller’s copy and reverts the plan when it was the last', async () => {
    const store = new FakeStore(
      { plannedTripId: 'p1', status: 'completed', loggedTripIds: { alex: 't-alex' } },
      3,
    );
    const result = await removePlannedTripFromLogbook(store, 'p1', 'alex');

    expect(store.detached).toEqual(['t-alex']);
    expect(store.deleted).toEqual(['t-alex']);
    expect(store.removed).toEqual([{ userId: 'alex', restoreToPlanning: true }]);
    expect(result.detachedExperiences).toBe(3);
  });

  it('keeps the plan completed while other participants still have a copy', async () => {
    const store = new FakeStore({
      plannedTripId: 'p1',
      status: 'completed',
      loggedTripIds: { alex: 't-alex', sam: 't-sam' },
    });
    await removePlannedTripFromLogbook(store, 'p1', 'alex');
    expect(store.deleted).toEqual(['t-alex']);
    expect(store.removed).toEqual([{ userId: 'alex', restoreToPlanning: false }]);
  });

  it('rejects when the caller has no copy', async () => {
    const store = new FakeStore({ plannedTripId: 'p1', status: 'completed', loggedTripIds: { sam: 't-sam' } });
    await expect(removePlannedTripFromLogbook(store, 'p1', 'alex')).rejects.toThrow();
  });
});
