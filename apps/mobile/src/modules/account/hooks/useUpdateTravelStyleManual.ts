/**
 * Manual travel-style edit (functional_specification.md §2.4) — always
 * goes through the `updateTravelStyleManual` callable, never a direct
 * Firestore write (firestore.rules blocks client writes to `travelStyle`
 * entirely; see functions/src/lib/manualStyleEdit.ts).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { TravelStyleVector } from '@amiva/core';
import { functions } from '../../../firebase/client';
import { useAuthStore } from './useAuthStore';

const updateTravelStyleManualCallable = httpsCallable<{ travelStyle: TravelStyleVector }, { success: true }>(
  functions,
  'updateTravelStyleManual',
);

export function useUpdateTravelStyleManual() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.firebaseUser?.uid);

  return useMutation({
    mutationFn: async (travelStyle: TravelStyleVector) => {
      await updateTravelStyleManualCallable({ travelStyle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', uid] });
    },
  });
}
