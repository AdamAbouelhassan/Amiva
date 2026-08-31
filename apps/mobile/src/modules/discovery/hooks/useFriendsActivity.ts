/** Discovery "Friends" tab — a chronological feed of friends' activity
 * (logged experiences/trips, saves, completed planned trips, new
 * connections), via the `getFriendsActivity` callable. Privacy is enforced
 * server-side (see functions/src/lib/friendsActivity.ts). */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/client';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

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

const getFriendsActivityCallable = httpsCallable<{ limit?: number }, ActivityItem[]>(
  functions,
  'getFriendsActivity',
);

export function useFriendsActivity() {
  const { profile } = useCurrentUser();
  const query = useQuery({
    queryKey: ['friendsActivity', profile?.uid],
    queryFn: async () => (await getFriendsActivityCallable({})).data,
    enabled: !!profile,
  });
  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : undefined,
    refetch: query.refetch,
  };
}
