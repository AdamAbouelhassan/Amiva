/**
 * The "update trip aggregate" part of `onExperienceCreated`
 * (technical_specification.md §5).
 *
 * functional_specification.md §3.2: "Trip cover photo: defaults to the
 * first image among the trip's experiences; user can manually override
 * it." The Trip schema (technical_specification.md §3.3) has a single
 * `coverPhotoUrl: string` with no separate "was this manually set" flag.
 * Assumption: to never silently clobber a manual override, we only ever
 * auto-set coverPhotoUrl when it is *currently unset* — i.e. the first
 * experience logged for a trip supplies the default, and nothing
 * auto-overwrites it after that (whether the current value came from
 * auto-default or a manual edit).
 */
import { TripStore } from './ports';

export async function maybeSetTripCoverPhoto(
  store: TripStore,
  tripId: string,
  newExperiencePhotoUrls: string[],
): Promise<void> {
  const firstPhoto = newExperiencePhotoUrls[0];
  if (!firstPhoto) return;

  const trip = await store.getTrip(tripId);
  if (!trip) return;
  if (trip.coverPhotoUrl) return; // already set (auto or manual) — never overwrite

  await store.setCoverPhotoIfUnset(tripId, firstPhoto);
}
