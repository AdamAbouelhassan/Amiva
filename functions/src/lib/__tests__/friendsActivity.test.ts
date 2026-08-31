import {
  FriendActivityStore,
  getFriendsActivity,
  RawCompletedPlannedTrip,
  RawExperience,
  RawFriendEdge,
  RawSave,
  RawTrip,
} from '../friendsActivity';
import { PrivacySetting } from '../visibility';

interface Seed {
  friendIds?: string[];
  experiences?: RawExperience[];
  trips?: RawTrip[];
  saves?: RawSave[];
  plannedTrips?: RawCompletedPlannedTrip[];
  edges?: RawFriendEdge[];
  privacy?: Record<string, PrivacySetting>;
}

class FakeStore implements FriendActivityStore {
  constructor(private s: Seed) {}
  async getFriendIdsOf(): Promise<string[]> {
    return this.s.friendIds ?? [];
  }
  async listExperiencesByOwners(ids: string[]): Promise<RawExperience[]> {
    return (this.s.experiences ?? []).filter((e) => ids.includes(e.ownerId));
  }
  async listTripsByOwners(ids: string[]): Promise<RawTrip[]> {
    return (this.s.trips ?? []).filter((t) => ids.includes(t.ownerId));
  }
  async listSavesByOwners(ids: string[]): Promise<RawSave[]> {
    return (this.s.saves ?? []).filter((x) => ids.includes(x.actorId));
  }
  async listCompletedPlannedTripsByOwners(ids: string[]): Promise<RawCompletedPlannedTrip[]> {
    return (this.s.plannedTrips ?? []).filter((p) => ids.includes(p.ownerId));
  }
  async listFriendEdgesByOwners(ids: string[]): Promise<RawFriendEdge[]> {
    return (this.s.edges ?? []).filter((e) => ids.includes(e.userId));
  }
  async getPrivacySettings(ids: string[]): Promise<Record<string, PrivacySetting>> {
    const out: Record<string, PrivacySetting> = {};
    for (const id of ids) if (this.s.privacy?.[id]) out[id] = this.s.privacy[id]!;
    return out;
  }
}

const D = (iso: string) => new Date(iso);

describe('getFriendsActivity', () => {
  it('returns nothing when the viewer has no friends', async () => {
    const store = new FakeStore({ friendIds: [], experiences: [{ experienceId: 'x', ownerId: 'a', createdAt: D('2026-01-01') }] });
    expect(await getFriendsActivity(store, 'viewer')).toEqual([]);
  });

  it('maps each kind and returns them newest-first', async () => {
    const store = new FakeStore({
      friendIds: ['alex', 'sam'],
      privacy: { alex: 'public', sam: 'public', stranger: 'public', newpal: 'public' },
      experiences: [{ experienceId: 'e1', ownerId: 'alex', createdAt: D('2026-03-01') }],
      trips: [
        {
          tripId: 't1',
          ownerId: 'sam',
          name: 'Japan',
          location: 'Tokyo, Japan',
          startDate: D('2026-02-01'),
          endDate: D('2026-02-10'),
          visibility: 'public',
          createdAt: D('2026-03-05'),
        },
      ],
      saves: [{ actorId: 'sam', experienceId: 'e9', experienceOwnerId: 'stranger', savedAt: D('2026-03-03') }],
      plannedTrips: [
        { plannedTripId: 'p1', ownerId: 'alex', location: 'Cusco, Peru', visibility: 'public', completedAt: D('2026-03-04') },
      ],
      edges: [{ userId: 'alex', friendId: 'newpal', createdAt: D('2026-03-02') }],
    });

    const items = await getFriendsActivity(store, 'viewer');
    expect(items.map((i) => i.kind)).toEqual([
      'trip_logged', // 03-05
      'planned_trip_completed', // 03-04
      'experience_saved', // 03-03
      'friend_added', // 03-02
      'experience_logged', // 03-01
    ]);
  });

  it("hides a private friend's logged experience but keeps a public one", async () => {
    const store = new FakeStore({
      friendIds: ['pub', 'priv'],
      privacy: { pub: 'public', priv: 'private' },
      experiences: [
        { experienceId: 'e-pub', ownerId: 'pub', createdAt: D('2026-01-02') },
        { experienceId: 'e-priv', ownerId: 'priv', createdAt: D('2026-01-01') },
      ],
    });
    const items = await getFriendsActivity(store, 'viewer');
    expect(items.map((i) => (i.kind === 'experience_logged' ? i.experienceId : null))).toEqual(['e-pub']);
  });

  it("drops a save when the saved experience's owner is private, keeps it when public", async () => {
    const store = new FakeStore({
      friendIds: ['sam'],
      privacy: { sam: 'public', privOwner: 'private', pubOwner: 'public' },
      saves: [
        { actorId: 'sam', experienceId: 'hidden', experienceOwnerId: 'privOwner', savedAt: D('2026-01-02') },
        { actorId: 'sam', experienceId: 'shown', experienceOwnerId: 'pubOwner', savedAt: D('2026-01-01') },
      ],
    });
    const items = await getFriendsActivity(store, 'viewer');
    expect(items.map((i) => (i.kind === 'experience_saved' ? i.experienceId : null))).toEqual(['shown']);
  });

  it('dedupes the two directions of a friend_added edge into one item', async () => {
    const store = new FakeStore({
      friendIds: ['alex', 'sam'],
      privacy: { alex: 'public', sam: 'public' },
      edges: [
        { userId: 'alex', friendId: 'sam', createdAt: D('2026-01-01') },
        { userId: 'sam', friendId: 'alex', createdAt: D('2026-01-01') },
      ],
    });
    const items = await getFriendsActivity(store, 'viewer');
    expect(items.filter((i) => i.kind === 'friend_added')).toHaveLength(1);
  });

  it('shows "someone" for a new connection who is private and not the viewer\'s friend', async () => {
    const store = new FakeStore({
      friendIds: ['alex'],
      privacy: { alex: 'public', mystery: 'private' },
      edges: [{ userId: 'alex', friendId: 'mystery', createdAt: D('2026-01-01') }],
    });
    const [item] = await getFriendsActivity(store, 'viewer');
    expect(item).toMatchObject({ kind: 'friend_added', actorId: 'alex', otherId: null });
  });

  it('respects the limit after the newest-first sort', async () => {
    const store = new FakeStore({
      friendIds: ['alex'],
      privacy: { alex: 'public' },
      experiences: Array.from({ length: 10 }, (_, i) => ({
        experienceId: `e${i}`,
        ownerId: 'alex',
        createdAt: D(`2026-01-${String(i + 1).padStart(2, '0')}`),
      })),
    });
    const items = await getFriendsActivity(store, 'viewer', 3);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ experienceId: 'e9' });
  });
});
