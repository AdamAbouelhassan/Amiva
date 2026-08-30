import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orNull } from '../../../lib/queryHelpers';
import { FriendRepository } from '../../../repositories/friendRepository';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export function useFriends() {
  const { profile } = useCurrentUser();
  return useQuery({
    queryKey: ['friends', profile?.uid],
    queryFn: () => FriendRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });
}

export function useFriendEdge(friendId: string | undefined) {
  const { profile } = useCurrentUser();
  return useQuery({
    queryKey: ['friends', profile?.uid, friendId],
    queryFn: () => FriendRepository.getEdge(profile!.uid, friendId!).then(orNull),
    enabled: !!profile && !!friendId,
  });
}

/** Direct add, no invite/accept step (functional_specification.md §6.3). */
export function useAddFriend() {
  const queryClient = useQueryClient();
  const { profile } = useCurrentUser();
  return useMutation({
    mutationFn: ({ friendId, addedVia }: { friendId: string; addedVia: 'contacts_sync' | 'qr_link' }) =>
      FriendRepository.add(friendId, addedVia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', profile?.uid] });
    },
  });
}
