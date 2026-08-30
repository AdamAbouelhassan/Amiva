import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../modules/account/hooks/useAuthStore';
import { orNull } from '../lib/queryHelpers';
import { UserRepository } from '../repositories/userRepository';

/** Shared across modules (CLAUDE.md: promote once used by 2+ modules) —
 * the Firebase auth identity plus the Firestore profile doc it maps to.
 * `profile` is `null` (not loading) once auth has settled but no Firestore
 * doc exists yet — that's the onboarding-not-completed signal the root
 * navigator uses. */
export function useCurrentUser() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const initializing = useAuthStore((s) => s.initializing);

  const profileQuery = useQuery({
    queryKey: ['users', firebaseUser?.uid],
    queryFn: () => UserRepository.getById(firebaseUser!.uid).then(orNull),
    enabled: !!firebaseUser,
  });

  return {
    firebaseUser,
    initializing,
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    refetchProfile: profileQuery.refetch,
  };
}
