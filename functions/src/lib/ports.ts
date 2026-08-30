/**
 * Storage "ports" — narrow interfaces describing exactly the Firestore
 * access each lib/ function needs, nothing more.
 *
 * This is what lets the actual business logic (style decay, compatibility,
 * trending, notifications) be tested as plain functions against in-memory
 * fakes, per CLAUDE.md #8 / the build brief's testing expectations
 * ("Cloud Function business logic should be tested as plain functions...
 * not only via emulator-dependent trigger tests"). The real
 * admin.firestore()-backed implementations live in src/adapters and are
 * wired up only inside the thin trigger files in src/triggers.
 */
import { TravelStyleVector } from '@amiva/core';

export interface UserStyleRecord {
  travelStyle: TravelStyleVector;
  travelStyleBaseline: TravelStyleVector;
  travelStyleLastUpdated: Date;
}

export interface UserStore {
  getUserStyle(userId: string): Promise<UserStyleRecord>;
  /** Automatic adjustment only ever changes `travelStyle` — baseline and
   * lastUpdated are untouched by anything but a manual edit
   * (functional_specification.md §2.4). */
  saveAutomaticStyleUpdate(userId: string, travelStyle: TravelStyleVector): Promise<void>;
  /** A manual edit resets all three fields together. */
  saveManualStyleEdit(userId: string, record: UserStyleRecord): Promise<void>;
}

export interface ExperienceRecord {
  experienceId: string;
  ownerId: string;
  tripId?: string;
  placeId: string;
  categoryScores: TravelStyleVector;
  photoUrls: string[];
  date: Date;
  rating: number;
}

export interface ExperienceStore {
  getExperience(experienceId: string): Promise<ExperienceRecord>;
}

export interface TripRecord {
  tripId: string;
  coverPhotoUrl?: string;
}

export interface TripStore {
  getTrip(tripId: string): Promise<TripRecord | undefined>;
  setCoverPhotoIfUnset(tripId: string, photoUrl: string): Promise<void>;
}

export interface FriendEdgeRecord {
  userId: string;
  friendId: string;
  compatibilityScore: number;
  addedVia: 'contacts_sync' | 'qr_link';
  createdAt: Date;
}

/** Backs the server-side re-implementation of firestore.rules'
 * canReadOwnedBy (see lib/visibility.ts) — the Admin SDK bypasses
 * security rules entirely, so anything reading across multiple users'
 * experiences for Feed/Trending (functions/src/lib/feed.ts,
 * functions/src/lib/trending.ts) must re-apply that same privacy cascade
 * itself in plain code, since Firestore can't gate a *query* by
 * per-document data reached through another document (CLAUDE.md's
 * `usernames` lookup-collection gotcha) the way it can a single-doc read. */
export interface VisibilityStore {
  /** Current privacySetting per uid. A uid absent from the result (e.g. a
   * deleted account) should be treated as not visible by callers. */
  getPrivacySettings(userIds: string[]): Promise<Record<string, 'public' | 'private' | 'friends'>>;
}

export interface FriendStore {
  createFriendEdgePair(edge: {
    userId: string;
    friendId: string;
    compatibilityScore: number;
    addedVia: 'contacts_sync' | 'qr_link';
    createdAt: Date;
  }): Promise<void>;
  getFriendIdsOf(userId: string): Promise<string[]>;
  updateCompatibilityScore(userId: string, friendId: string, score: number): Promise<void>;
}

export type NotificationType = 'trip_completed' | 'friend_added' | 'group_trip_joined' | 'new_match';

export interface NotificationRecord {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export interface NotificationStore {
  createNotification(input: Omit<NotificationRecord, 'notificationId' | 'read'>): Promise<string>;
}

export interface PushSender {
  /** Resolves the recipient's FCM token(s) and sends; a no-op (logged, not
   * thrown) if the user has no registered device, so a missing token never
   * fails the triggering write. */
  sendToUser(userId: string, message: { title: string; body: string; data?: Record<string, string> }): Promise<void>;
}
