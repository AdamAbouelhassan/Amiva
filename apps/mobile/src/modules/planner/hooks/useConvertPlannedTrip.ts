/**
 * Completion flow (functional_specification.md §4.3): converting planned
 * items into real Logbook entries, per-item, with a skip option — via the
 * `convertPlannedTripToLogbook` callable (server-side, since it creates
 * Experience docs and possibly a new Trip).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { TravelStyleVector } from '@amiva/core';
import { functions } from '../../../firebase/client';

export type ConversionDecision =
  | {
      itemId: string;
      action: 'convert';
      details: {
        photoUrls: string[];
        rating: number;
        notes: string;
        categoryScores: TravelStyleVector;
        date: string; // ISO — callable payloads are JSON, not Date objects
        dateSource: 'exif' | 'manual';
      };
    }
  | { itemId: string; action: 'skip' };

const convertCallable = httpsCallable<
  { plannedTripId: string; decisions: ConversionDecision[] },
  { converted: string[]; skipped: string[] }
>(functions, 'convertPlannedTripToLogbook');

export function useConvertPlannedTrip(plannedTripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decisions: ConversionDecision[]) => convertCallable({ plannedTripId, decisions }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedTripItems', plannedTripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    },
  });
}
