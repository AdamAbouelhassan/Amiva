/** A friend's profile content — trips, planned trips, and logged
 * experiences (with their `tripId` + date so the Logbook tab can render a
 * merged reverse-chronological timeline and open a read-only trip) — all
 * privacy-filtered server-side (functions/src/lib/userProfileContent.ts). */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';

export interface ProfileTrip {
  tripId: string;
  name: string;
  location: string;
  coverPhotoUrl?: string;
  photoUrls: string[];
  notes?: string;
  accommodation?: string;
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
export interface ProfileExperience {
  experienceId: string;
  tripId: string | null;
  date: string;
}
export interface UserProfileContent {
  trips: ProfileTrip[];
  plannedTrips: ProfilePlannedTrip[];
  experiences: ProfileExperience[];
}

const callable = httpsCallable<{ targetUserId: string }, UserProfileContent>(
  functions,
  'getUserProfileContent',
);

export function useUserProfileContent(targetUserId: string | undefined) {
  return useQuery({
    queryKey: ['userProfileContent', targetUserId],
    queryFn: async () => (await callable({ targetUserId: targetUserId! })).data,
    enabled: !!targetUserId,
  });
}
