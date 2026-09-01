/** A friend's profile content — trips, planned trips, logged experience
 * ids — all privacy-filtered server-side (functions/src/lib/userProfileContent.ts). */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';

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
