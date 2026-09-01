import { TravelStyleVector } from '@amiva/core';
import { PlaceDoc } from '../repositories/types';

export type MainTabParamList = {
  Discovery: undefined;
  Logbook: undefined;
  Planner: undefined;
  Social: undefined;
  Account: undefined;
};

/** Seeds a fresh "Log an experience" form — used when a user logs their own
 * visit to a place they saw on someone else's experience or saved from
 * Discovery. */
export interface ExperiencePrefill {
  place: Omit<PlaceDoc, 'createdAt'> & { photoRef?: string };
  title?: string;
  categoryScores?: TravelStyleVector;
}

export type CreateExperienceParams = { tripId?: string; prefill?: ExperiencePrefill } | undefined;

/** The <MatchScoreBadge> tap target — the two travel styles overlaid.
 * `vectorA` (the viewer's) is read from `useCurrentUser` in the screen, so
 * only the *other* vector travels. Shown as a `presentation: 'modal'`
 * screen — same sheet + swipe as "Log experience". */
export type MatchDetailParams = { title: string; matchPercent: number; vector: TravelStyleVector };

export type LogbookStackParamList = {
  LogbookHome: undefined;
  TripDetail: { tripId: string };
  EditTrip: { tripId: string };
  CountryDetail: { country: string };
  CityDetail: { country: string; city: string };
  CreateTrip: undefined;
  CreateExperience: CreateExperienceParams;
  ExperienceDetail: { experienceId: string };
  EditExperience: { experienceId: string };
  MatchDetail: MatchDetailParams;
};

export type DiscoveryStackParamList = {
  // Local / Trending / Friends are in-page tabs, not routes.
  DiscoverHome: undefined;
  ExperienceDetail: { experienceId: string };
  EditExperience: { experienceId: string };
  Saved: undefined;
  CreateExperience: CreateExperienceParams;
  MatchDetail: MatchDetailParams;
};

export type SocialStackParamList = {
  FriendsList: undefined;
  FriendDetail: { friendId: string };
  AddFriend: undefined;
  GroupTripDetail: { plannedTripId: string };
  Notifications: undefined;
  ExperienceDetail: { experienceId: string };
  CreateExperience: CreateExperienceParams;
  MatchDetail: MatchDetailParams;
};

export type PlannerStackParamList = {
  PlannerOverview: undefined;
  PlannedTripDetail: { plannedTripId: string };
  CreatePlannedTrip: undefined;
  EditPlannedTrip: { plannedTripId: string };
  AddPlacesToPlan: { plannedTripId: string };
  CompletePlannedTrip: { plannedTripId: string };
  // Registered so "Log this" from AddPlacesToPlan stays inside the Planner
  // stack instead of bubbling to another tab (reuses the Logbook screen).
  CreateExperience: CreateExperienceParams;
  MatchDetail: MatchDetailParams;
};

export type AccountStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditTravelStyle: undefined;
};
