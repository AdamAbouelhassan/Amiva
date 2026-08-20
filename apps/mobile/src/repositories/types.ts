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
  countries: string[];
  startDate: Date;
  endDate: Date;
  name: string;
  coverPhotoUrl: string;
  visibility: PrivacySetting;
  createdAt: Date;
}

export interface ExperienceDoc {
  experienceId: string;
  ownerId: string;
  tripId?: string;
  placeId: string;
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

export type PlannedTripStatus = 'planning' | 'upcoming' | 'completed';

export interface PlannedTripDoc {
  plannedTripId: string;
  ownerId: string;
  collaboratorIds: string[];
  locations: string[];
  startDate: Date;
  endDate: Date;
  status: PlannedTripStatus;
  visibility: PrivacySetting;
  itemIds: string[];
  createdAt: Date;
}

export interface PlannedTripItemDoc {
  itemId: string;
  plannedTripId: string;
  source: 'saved' | 'recommended';
  placeId: string;
  title: string;
  categoryScores?: TravelStyleVector;
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
