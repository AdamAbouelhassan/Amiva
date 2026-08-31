/**
 * Recommendations — functional_specification.md §5.2, rebuilt (Discover
 * rebuild, 2026-08-30) to pull directly from the Google Places catalog
 * rather than existing Amiva posts. Filterable by a location
 * (country/province/city, autocompleted — and pre-filled from the
 * device's current location) plus a free-text keyword and an optional
 * category, via the getPlaceRecommendations callable.
 */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useMemo, useState } from 'react';
import { TravelStyleCategory, TravelStyleVector } from '@amiva/core';
import type { SelectedLocation } from '../../../components/LocationSearchField';
import { useCurrentLocation } from '../../../hooks/useCurrentLocation';
import { functions } from '../../../firebase/client';

export interface PlaceRecommendationFilter {
  country: string;
  city?: string;
  category?: TravelStyleCategory;
  text?: string;
}

export interface PlaceRecommendationResult {
  placeId: string;
  name: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  categoryScores: TravelStyleVector;
  matchScore: number;
  /** Google Places photo references — turn into image URLs via placePhotoUrl(). */
  photoReferences: string[];
  /** Short category label ("Restaurant", "Museum", …). */
  primaryType?: string;
}

export interface LocalSection {
  /** `'search'` for keyword results, otherwise the category id. */
  key: string;
  category: TravelStyleCategory | null;
  items: PlaceRecommendationResult[];
}

const getPlaceRecommendationsCallable = httpsCallable<
  { filter: PlaceRecommendationFilter; rows?: number; perRow?: number },
  LocalSection[]
>(functions, 'getPlaceRecommendations');

export function useRecommendations() {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<TravelStyleCategory | undefined>();
  const [location, setLocationState] = useState<SelectedLocation | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);

  const current = useCurrentLocation();

  // Pre-fill from the device location once, unless the user has already
  // picked something themselves.
  useEffect(() => {
    if (!locationTouched && current.location) setLocationState(current.location);
  }, [current.location, locationTouched]);

  function setLocation(next: SelectedLocation) {
    setLocationTouched(true);
    setLocationState(next);
  }

  const filter = useMemo<PlaceRecommendationFilter>(
    () => ({
      country: location?.country ?? '',
      city: location?.city,
      category,
      text: text.trim() || undefined,
    }),
    [location, category, text],
  );
  const hasLocation = filter.country.length > 0;

  const query = useQuery({
    queryKey: ['placeRecommendations', filter],
    queryFn: async () => (await getPlaceRecommendationsCallable({ filter })).data,
    enabled: hasLocation,
    // Places Text Search is a billed call and results don't change minute
    // to minute — keep a result set fresh across tab switches / leaving
    // and returning to Discovery instead of refetching each time.
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

  const sections = query.data ?? [];

  return {
    sections,
    hasResults: sections.some((s) => s.items.length > 0),
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : undefined,
    hasSearched: hasLocation,
    // location
    location,
    setLocation,
    locationLoading: current.loading && !locationTouched,
    // keyword + category
    text,
    setText,
    category,
    setCategory,
  };
}
