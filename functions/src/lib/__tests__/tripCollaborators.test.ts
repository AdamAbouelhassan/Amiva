import { addTripCollaborator, CollaboratorPlannedTrip, TripCollaboratorStore } from '../tripCollaborators';
import { NotificationRecord } from '../ports';

class FakeStore implements TripCollaboratorStore {
  notifications: Omit<NotificationRecord, 'notificationId' | 'read'>[] = [];
  added: string[] = [];
  constructor(
    private readonly cfg: {
      trip?: CollaboratorPlannedTrip;
      users?: string[];
    },
  ) {}
  async getPlannedTrip() {
    return this.cfg.trip;
  }
  async userExists(userId: string) {
    return (this.cfg.users ?? []).includes(userId);
  }
  async addCollaborator(_plannedTripId: string, collaboratorId: string) {
    this.added.push(collaboratorId);
  }
  async createNotification(input: Omit<NotificationRecord, 'notificationId' | 'read'>) {
    this.notifications.push(input);
    return 'n1';
  }
}

const now = new Date('2026-05-01');

describe('addTripCollaborator', () => {
  it('adds the collaborator and notifies them', async () => {
    const store = new FakeStore({
      trip: { ownerId: 'owner', collaboratorIds: [] },
      users: ['friend'],
    });
    const out = await addTripCollaborator(store, {
      plannedTripId: 'p1',
      actorId: 'owner',
      collaboratorId: 'friend',
      now,
    });
    expect(out).toEqual({ added: true });
    expect(store.added).toEqual(['friend']);
    expect(store.notifications).toEqual([
      { recipientId: 'friend', type: 'group_trip_joined', payload: { plannedTripId: 'p1', actorId: 'owner' }, createdAt: now },
    ]);
  });

  it('lets an existing collaborator add another', async () => {
    const store = new FakeStore({
      trip: { ownerId: 'owner', collaboratorIds: ['a'] },
      users: ['b'],
    });
    await addTripCollaborator(store, { plannedTripId: 'p1', actorId: 'a', collaboratorId: 'b', now });
    expect(store.added).toEqual(['b']);
  });

  it('rejects a non-participant actor', async () => {
    const store = new FakeStore({ trip: { ownerId: 'owner', collaboratorIds: [] }, users: ['x', 'stranger'] });
    await expect(
      addTripCollaborator(store, { plannedTripId: 'p1', actorId: 'stranger', collaboratorId: 'x', now }),
    ).rejects.toThrow();
  });

  it('is idempotent when already a collaborator', async () => {
    const store = new FakeStore({ trip: { ownerId: 'owner', collaboratorIds: ['friend'] }, users: ['friend'] });
    const out = await addTripCollaborator(store, {
      plannedTripId: 'p1',
      actorId: 'owner',
      collaboratorId: 'friend',
      now,
    });
    expect(out).toEqual({ added: false });
    expect(store.notifications).toEqual([]);
  });

  it('rejects an unknown user', async () => {
    const store = new FakeStore({ trip: { ownerId: 'owner', collaboratorIds: [] }, users: [] });
    await expect(
      addTripCollaborator(store, { plannedTripId: 'p1', actorId: 'owner', collaboratorId: 'ghost', now }),
    ).rejects.toThrow();
  });
});
