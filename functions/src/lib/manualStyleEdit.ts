/**
 * Backs an `updateTravelStyleManual` callable.
 *
 * Not one of the 8 functions named in technical_specification.md §5's API
 * table, but required by technical_specification.md §6: "`travelStyle`...
 * [is a] Cloud-Function-only write via Admin SDK." The table lists the
 * *automatic* recompute triggers; it doesn't separately name the manual-
 * edit path described in functional_specification.md §2.4 ("Users can
 * manually edit their travel style sliders at any time from Account
 * Settings"). Since the security model requires every write to
 * `travelStyle` to go through a Cloud Function, this callable is the
 * minimal missing piece to make that already-specified user action
 * possible at all — not a new feature. Firestore rules (see
 * firestore.rules) reject any direct client write to `users/{uid}.travelStyle`
 * or `.travelStyleBaseline`, so this is the only path to them.
 */
import { applyManualStyleEdit, TravelStyleVector } from '@amiva/core';
import { UserStore } from './ports';

export async function updateTravelStyleManual(
  store: UserStore,
  userId: string,
  newVector: TravelStyleVector,
  now: Date,
): Promise<void> {
  const record = applyManualStyleEdit(newVector, now);
  await store.saveManualStyleEdit(userId, record);
}
