/**
 * Firestore document shapes — one-to-one with technical_specification.md
 * §3. Field names match the spec's TypeScript exactly (CLAUDE.md: "don't
 * invent alternate field names during implementation"). Timestamps are
 * represented as `Date` here (converted at the repository boundary);
 * nothing above the repository layer should see a Firestore `Timestamp`.
 */
import { TravelStyleVector } from '@amiva/core';

export type PrivacySetting = 'public' | 'private' | 'friends';

export interface UserDoc {
  uid: string;
  username: string;
  name: string;
  email: string;
  phoneNumber?: string;
  /** SHA-256 hash of phoneNumber, maintained client-side alongside it —
   * see src/lib/phoneHash.ts. Not part of technical_specification.md
   * §3.1's User interface; an infra addition enabling contacts-sync
   * matching per §6 without ever transmitting a raw phone number. */
  phoneNumberHash?: string;
  profilePhotoUrl?: string;
  privacySetting: PrivacySetting;
  travelStyle: TravelStyleVector;
  travelStyleBaseline: TravelStyleVector;
  travelStyleLastUpdated: Date;
  createdAt: Date;
  recentSearches: string[];
}

export interface PlaceDoc {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  googlePlaceType?: string;
  createdAt: Date;
}

export interface TripDoc {
  tripId: string;
  ownerId: string;
  /** Display label from the location picker, e.g. "Tokyo, Japan". A trip is
   * tied to exactly one location (2026-08 restructure — replaced the old
   * `countries: string[]`). */
  location: string;
  country: string;
  city?: string;
  startDate: Date;
  endDate: Date;
  /** Auto-generated from location + date range, editable. "Trip name" in UI. */
  name: string;
  notes?: string;
  accommodation?: string;
  /** Trip-level photo gallery. */
  photoUrls: string[];
  /** Defaults to photoUrls[0] ?? first experience photo; user can override. */
  coverPhotoUrl: string;
  visibility: PrivacySetting;
  createdAt: Date;
}

export interface ExperienceDoc {
  experienceId: string;
  ownerId: string;
  tripId?: string;
  placeId: string;
  /** The Google Maps place name, denormalised at log time so the logbook
   * can show *where* an entry is without a `places` lookup. `''` on
   * experiences logged before 2026-09-01. */
  placeName: string;
  city: string;
  country: string;
  title: string;
  notes: string;
  rating: number;
  photoUrls: string[];
  categoryScores: TravelStyleVector;
  date: Date;
  dateSource: 'exif' | 'manual';
  postType: 'experience' | 'city' | 'trip';
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveDoc {
  userId: string;
  experienceId: string;
  savedAt: Date;
}

/** A user's saved raw Google Place from Discover > Recommendations
 * (Discover rebuild, 2026-08-30) — the `saves` collection is keyed by
 * experienceId (an Amiva post) and doesn't fit a place that's never been
 * logged, so this is a small parallel collection mirroring its shape.
 * Feeds Planner's "Add from your saved places" the same way `saves`
 * feeds "Add from your saves" (functional_specification.md §4.2). */
export interface SavedPlaceDoc {
  userId: string;
  placeId: string;
  name: string;
  country: string;
  city: string;
  /** Persisted so "Log this" can seed an experience without re-hitting the
   * Google Places Details API. Absent on saves made before 2026-08-31. */
  lat?: number;
  lng?: number;
  /** First Google `photo_reference` for the place, so the Saved list can
   * show a thumbnail. Absent on saves made before 2026-08-31. */
  photoRef?: string;
  categoryScores: TravelStyleVector;
  savedAt: Date;
}

export type PlannedTripStatus = 'planning' | 'upcoming' | 'completed';

export interface PlannedTripDoc {
  plannedTripId: string;
  ownerId: string;
  collaboratorIds: string[];
  /** Same shape as TripDoc (2026-08 restructure — a planned trip is a future
   * trip). Replaced the old `locations: string[]`. */
  location: string;
  country: string;
  city?: string;
  startDate: Date;
  endDate: Date;
  name: string;
  notes?: string;
  accommodation?: string;
  photoUrls: string[];
  status: PlannedTripStatus;
  visibility: PrivacySetting;
  itemIds: string[];
  createdAt: Date;
  /** Set when status first becomes 'completed'. Cleared on revert. */
  completedAt?: Date;
  /** The Logbook trip this plan was turned into on completion. Drives
   * "View in Logbook" and revert. */
  convertedToTripId?: string;
}

export interface PlannedTripItemDoc {
  itemId: string;
  plannedTripId: string;
  source: 'saved' | 'recommended';
  placeId: string;
  title: string;
  categoryScores?: TravelStyleVector;
  /** Denormalised from the place at add-time — thumbnail + "Log this" seed. */
  city?: string;
  country?: string;
  photoRef?: string;
  lat?: number;
  lng?: number;
  completed: boolean;
  convertedToExperienceId?: string;
}

export interface FriendEdgeDoc {
  userId: string;
  friendId: string;
  compatibilityScore: number;
  addedVia: 'contacts_sync' | 'qr_link';
  createdAt: Date;
}

export type NotificationType = 'trip_completed' | 'friend_added' | 'group_trip_joined' | 'new_match';

export interface NotificationDoc {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}
