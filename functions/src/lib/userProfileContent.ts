/**
 * Backs the `getUserProfileContent` callable — a friend's profile shows
 * their trips, planned trips, and logged experiences. Like
 * lib/friendsActivity.ts this runs under the Admin SDK and is therefore the
 * enforcement point for cross-user visibility (firestore.rules can't gate
 * these collection queries).
 *
 * Visibility (functional_specification.md §3.6):
 *  - trips / planned trips: per-doc `visibility` via `isVisibleTo`
 *    (public / friends-and-viewer-is-a-friend / owner); planned-trip
 *    collaborators also allowed.
 *  - experiences: no per-doc visibility field — firestore.rules gates them
 *    by the *owner's account* `privacySetting`, so we do the same.
 */
import { isVisibleTo, PrivacySetting } from './visibility';

export interface RawProfileTrip {
  tripId: string;
  name: string;
  location: string;
  coverPhotoUrl?: string;
  startDate: Date;
  endDate: Date;
  visibility: PrivacySetting;
}

export interface RawProfilePlannedTrip {
  plannedTripId: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: string;
  visibility: PrivacySetting;
  collaboratorIds: string[];
}

export interface UserProfileContentStore {
  getFriendIdsOf(userId: string): Promise<string[]>;
  getPrivacySetting(userId: string): Promise<PrivacySetting | undefined>;
  listTripsByOwner(ownerId: string): Promise<RawProfileTrip[]>;
  listPlannedTripsByOwner(ownerId: string): Promise<RawProfilePlannedTrip[]>;
  listExperienceIdsByOwner(ownerId: string, limit: number): Promise<string[]>;
}

export interface ProfileTrip {
  tripId: string;
  name: string;
  location: string;
  coverPhotoUrl?: string;
  startDate: string;
  endDate: string;
}
export interface ProfilePlannedTrip {
  plannedTripId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface UserProfileContent {
  trips: ProfileTrip[];
  plannedTrips: ProfilePlannedTrip[];
  experienceIds: string[];
}

const EXPERIENCE_LIMIT = 50;

export async function getUserProfileContent(
  store: UserProfileContentStore,
  viewerId: string,
  targetUserId: string,
): Promise<UserProfileContent> {
  const friendSet = new Set(await store.getFriendIdsOf(viewerId));
  const privacy = await store.getPrivacySetting(targetUserId);
  const accountVisible = isVisibleTo(viewerId, targetUserId, privacy, friendSet);

  const [rawTrips, rawPlanned] = await Promise.all([
    store.listTripsByOwner(targetUserId),
    store.listPlannedTripsByOwner(targetUserId),
  ]);

  const trips: ProfileTrip[] = rawTrips
    .filter((t) => isVisibleTo(viewerId, targetUserId, t.visibility, friendSet))
    .map((t) => ({
      tripId: t.tripId,
      name: t.name,
      location: t.location,
      coverPhotoUrl: t.coverPhotoUrl,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
    }));

  const plannedTrips: ProfilePlannedTrip[] = rawPlanned
    .filter(
      (p) =>
        isVisibleTo(viewerId, targetUserId, p.visibility, friendSet) ||
        p.collaboratorIds.includes(viewerId),
    )
    .map((p) => ({
      plannedTripId: p.plannedTripId,
      name: p.name,
      location: p.location,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      status: p.status,
    }));

  const experienceIds = accountVisible
    ? await store.listExperienceIdsByOwner(targetUserId, EXPERIENCE_LIMIT)
    : [];

  return { trips, plannedTrips, experienceIds };
}
