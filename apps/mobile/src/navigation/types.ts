export type MainTabParamList = {
  Discovery: undefined;
  Logbook: undefined;
  Planner: undefined;
  Social: undefined;
  Account: undefined;
};

export type LogbookStackParamList = {
  LogbookHome: undefined;
  TripDetail: { tripId: string };
  CityDetail: { country: string; city: string };
  CreateTrip: undefined;
  CreateExperience: { tripId?: string } | undefined;
  ExperienceDetail: { experienceId: string };
};

export type DiscoveryStackParamList = {
  Feed: undefined;
  ExperienceDetail: { experienceId: string };
  Search: undefined;
  Trending: undefined;
  Recommendations: undefined;
};

export type SocialStackParamList = {
  FriendsList: undefined;
  FriendDetail: { friendId: string };
  AddFriend: undefined;
  GroupTripDetail: { plannedTripId: string };
  Notifications: undefined;
};

export type PlannerStackParamList = {
  PlannerOverview: undefined;
  PlannedTripDetail: { plannedTripId: string };
  CreatePlannedTrip: undefined;
};

export type AccountStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditTravelStyle: undefined;
};
