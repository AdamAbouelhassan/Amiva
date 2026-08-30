import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { SavedPlaceRepository } from '../../../repositories/savedPlaceRepository';

/** Source #2 for adding items to a planned trip's itinerary — saved raw
 * Google Places from Discover > Recommendations, parallel to
 * useSavedExperiences (source #1, functional_specification.md §4.2's
 * priority order). */
export function useSavedPlaces() {
  const { profile } = useCurrentUser();
  const query = useQuery({
    queryKey: ['savedPlaces', profile?.uid],
    queryFn: () => SavedPlaceRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });

  return { data: query.data ?? [], isLoading: query.isLoading };
}
