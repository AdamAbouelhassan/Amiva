import {
  getUserProfileContent,
  RawProfilePlannedTrip,
  RawProfileTrip,
  UserProfileContentStore,
} from '../userProfileContent';
import { PrivacySetting } from '../visibility';

const D = (s: string) => new Date(s);

class FakeStore implements UserProfileContentStore {
  constructor(
    private readonly cfg: {
      friendsOf?: Record<string, string[]>;
      privacy?: Record<string, PrivacySetting>;
      trips?: RawProfileTrip[];
      plannedTrips?: RawProfilePlannedTrip[];
      experienceIds?: string[];
    },
  ) {}
  async getFriendIdsOf(userId: string) {
    return this.cfg.friendsOf?.[userId] ?? [];
  }
  async getPrivacySetting(userId: string) {
    return this.cfg.privacy?.[userId];
  }
  async listTripsByOwner() {
    return this.cfg.trips ?? [];
  }
  async listPlannedTripsByOwner() {
    return this.cfg.plannedTrips ?? [];
  }
  async listExperienceIdsByOwner() {
    return this.cfg.experienceIds ?? [];
  }
}

const trip = (id: string, visibility: PrivacySetting): RawProfileTrip => ({
  tripId: id,
  name: id,
  location: 'Tokyo',
  startDate: D('2026-01-01'),
  endDate: D('2026-01-05'),
  visibility,
});

describe('getUserProfileContent', () => {
  it('hides everything from a viewer who cannot see a private account', async () => {
    const store = new FakeStore({
      privacy: { target: 'private' },
      trips: [trip('t-pub', 'public'), trip('t-priv', 'private')],
      experienceIds: ['e1', 'e2'],
    });
    const out = await getUserProfileContent(store, 'viewer', 'target');
    // per-trip visibility still applies — a 'public' trip on a private
    // account is still public
    expect(out.trips.map((t) => t.tripId)).toEqual(['t-pub']);
    expect(out.experienceIds).toEqual([]); // account not visible → no experiences
  });

  it('shows friends-only trips + experiences to a friend', async () => {
    const store = new FakeStore({
      friendsOf: { viewer: ['target'] },
      privacy: { target: 'friends' },
      trips: [trip('t-friends', 'friends'), trip('t-priv', 'private'), trip('t-pub', 'public')],
      experienceIds: ['e1', 'e2'],
    });
    const out = await getUserProfileContent(store, 'viewer', 'target');
    expect(out.trips.map((t) => t.tripId).sort()).toEqual(['t-friends', 't-pub']);
    expect(out.experienceIds).toEqual(['e1', 'e2']);
  });

  it('lets a planned-trip collaborator see a private plan', async () => {
    const store = new FakeStore({
      privacy: { target: 'public' },
      plannedTrips: [
        {
          plannedTripId: 'p1',
          name: 'p1',
          location: 'Rome',
          startDate: D('2026-03-01'),
          endDate: D('2026-03-05'),
          status: 'planning',
          visibility: 'private',
          collaboratorIds: ['viewer'],
        },
      ],
    });
    const out = await getUserProfileContent(store, 'viewer', 'target');
    expect(out.plannedTrips.map((p) => p.plannedTripId)).toEqual(['p1']);
  });

  it('the owner sees their own everything', async () => {
    const store = new FakeStore({
      privacy: { me: 'private' },
      trips: [trip('t-priv', 'private')],
      experienceIds: ['e1'],
    });
    const out = await getUserProfileContent(store, 'me', 'me');
    expect(out.trips.map((t) => t.tripId)).toEqual(['t-priv']);
    expect(out.experienceIds).toEqual(['e1']);
  });
});
