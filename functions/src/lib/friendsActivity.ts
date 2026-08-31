/**
 * Backs the `getFriendsActivity` callable — the Discovery "Friends" tab: a
 * chronological feed of what the viewer's friends have been doing, across
 * five event kinds (logged experience, logged Logbook trip, saved
 * experience, completed planned trip, new friend connection).
 *
 * Same reasoning as lib/feed.ts for why this is a Cloud Function and not a
 * client query: it reads across many other users' `experiences` / `trips`
 * / `saves` / `plannedTrips` / `friends` docs, and firestore.rules can't
 * gate a collection query by another document's `privacySetting`. Running
 * under the Admin SDK, this function is the actual enforcement point —
 * every experience/trip is checked against its owner's visibility
 * (lib/visibility.ts's `isVisibleTo`, the same rule `canReadOwnedBy`
 * encodes) before it's returned.
 */
import { isVisibleTo, PrivacySetting } from './visibility';

export interface RawExperience {
  experienceId: string;
  ownerId: string;
  createdAt: Date;
}

export interface RawTrip {
  tripId: string;
  ownerId: string;
  name: string;
  location: string;
  coverPhotoUrl?: string;
  startDate: Date;
  endDate: Date;
  visibility: PrivacySetting;
  createdAt: Date;
}

export interface RawSave {
  actorId: string;
  experienceId: string;
  experienceOwnerId: string;
  savedAt: Date;
}

export interface RawCompletedPlannedTrip {
  plannedTripId: string;
  ownerId: string;
  location: string;
  visibility: PrivacySetting;
  completedAt: Date;
}

export interface RawFriendEdge {
  userId: string;
  friendId: string;
  createdAt: Date;
}

export interface FriendActivityStore {
  getFriendIdsOf(userId: string): Promise<string[]>;
  listExperiencesByOwners(ownerIds: string[], limit: number): Promise<RawExperience[]>;
  listTripsByOwners(ownerIds: string[], limit: number): Promise<RawTrip[]>;
  listSavesByOwners(ownerIds: string[], limit: number): Promise<RawSave[]>;
  listCompletedPlannedTripsByOwners(ownerIds: string[], limit: number): Promise<RawCompletedPlannedTrip[]>;
  listFriendEdgesByOwners(ownerIds: string[], limit: number): Promise<RawFriendEdge[]>;
  getPrivacySettings(userIds: string[]): Promise<Record<string, PrivacySetting>>;
}

export type ActivityItem =
  | { kind: 'experience_logged'; id: string; actorId: string; createdAt: string; experienceId: string }
  | { kind: 'experience_saved'; id: string; actorId: string; createdAt: string; experienceId: string }
  | {
      kind: 'trip_logged';
      id: string;
      actorId: string;
      createdAt: string;
      trip: {
        tripId: string;
        name: string;
        location: string;
        coverPhotoUrl?: string;
        startDate: string;
        endDate: string;
      };
    }
  | { kind: 'planned_trip_completed'; id: string; actorId: string; createdAt: string; location: string }
  | { kind: 'friend_added'; id: string; actorId: string; createdAt: string; otherId: string | null };

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export async function getFriendsActivity(
  store: FriendActivityStore,
  viewerId: string,
  limit = 40,
): Promise<ActivityItem[]> {
  const friendIds = await store.getFriendIdsOf(viewerId);
  if (friendIds.length === 0) return [];
  const friendSet = new Set(friendIds);
  const perSource = limit * 2;

  const [experiences, trips, saves, plannedTrips, edges] = await Promise.all([
    store.listExperiencesByOwners(friendIds, perSource),
    store.listTripsByOwners(friendIds, perSource),
    store.listSavesByOwners(friendIds, perSource),
    store.listCompletedPlannedTripsByOwners(friendIds, perSource),
    store.listFriendEdgesByOwners(friendIds, perSource),
  ]);

  const ownersToCheck = new Set<string>();
  experiences.forEach((e) => ownersToCheck.add(e.ownerId));
  saves.forEach((s) => ownersToCheck.add(s.experienceOwnerId));
  edges.forEach((e) => ownersToCheck.add(e.friendId));
  const privacy = await store.getPrivacySettings([...ownersToCheck]);

  const items: ActivityItem[] = [];

  for (const e of experiences) {
    if (e.ownerId === viewerId) continue;
    if (!isVisibleTo(viewerId, e.ownerId, privacy[e.ownerId], friendSet)) continue;
    items.push({
      kind: 'experience_logged',
      id: `exp:${e.experienceId}`,
      actorId: e.ownerId,
      createdAt: e.createdAt.toISOString(),
      experienceId: e.experienceId,
    });
  }

  for (const t of trips) {
    if (t.ownerId === viewerId) continue;
    if (!isVisibleTo(viewerId, t.ownerId, t.visibility, friendSet)) continue;
    items.push({
      kind: 'trip_logged',
      id: `trip:${t.tripId}`,
      actorId: t.ownerId,
      createdAt: t.createdAt.toISOString(),
      trip: {
        tripId: t.tripId,
        name: t.name,
        location: t.location,
        coverPhotoUrl: t.coverPhotoUrl,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
      },
    });
  }

  for (const s of saves) {
    if (s.actorId === viewerId || s.experienceOwnerId === viewerId) continue;
    if (!isVisibleTo(viewerId, s.experienceOwnerId, privacy[s.experienceOwnerId], friendSet)) continue;
    items.push({
      kind: 'experience_saved',
      id: `save:${s.actorId}:${s.experienceId}`,
      actorId: s.actorId,
      createdAt: s.savedAt.toISOString(),
      experienceId: s.experienceId,
    });
  }

  for (const p of plannedTrips) {
    if (p.ownerId === viewerId) continue;
    if (!isVisibleTo(viewerId, p.ownerId, p.visibility, friendSet)) continue;
    items.push({
      kind: 'planned_trip_completed',
      id: `ptrip:${p.plannedTripId}`,
      actorId: p.ownerId,
      createdAt: p.completedAt.toISOString(),
      location: p.location,
    });
  }

  const seenPairs = new Set<string>();
  for (const edge of edges) {
    if (!friendSet.has(edge.userId)) continue; // actor must be a friend
    if (edge.friendId === viewerId) continue; // "you became friends with X" isn't feed-worthy to you
    const key = pairKey(edge.userId, edge.friendId);
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    const otherVisible =
      privacy[edge.friendId] === 'public' || friendSet.has(edge.friendId);
    items.push({
      kind: 'friend_added',
      id: `friend:${key}`,
      actorId: edge.userId,
      createdAt: edge.createdAt.toISOString(),
      otherId: otherVisible ? edge.friendId : null,
    });
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items.slice(0, limit);
}
