import { useQuery } from '@tanstack/react-query';
import { orNull } from '../lib/queryHelpers';
import { UserRepository } from '../repositories/userRepository';

/** Shared across modules — anywhere a RadarChart needs a user's current
 * travel style (own profile, friend compatibility detail, group trip
 * view). Always the server-persisted value (never client-computed). */
export function useTravelStyle(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'travelStyle'],
    queryFn: async () => {
      const user = await UserRepository.getById(userId!);
      return orNull(user?.travelStyle);
    },
    enabled: !!userId,
  });
}
