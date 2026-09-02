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
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
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
  /** Google rating, 1.0–5.0 (absent for unrated places). */
  rating?: number;
  /** Number of Google reviews behind the rating. */
  userRatingsTotal?: number;
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
  // What the query actually uses — trails the field by 400ms so typing
  // stays responsive and doesn't fire a (billed) Places call per keystroke.
  const [debouncedText, setDebouncedText] = useState('');
  const [category, setCategory] = useState<TravelStyleCategory | undefined>();
  // The chips render off `category` (instant highlight); the query runs off
  // the deferred copy so selecting one never blocks the tap. Must be the
  // primitive, not the `filter` object — `useDeferredValue` on a value
  // re-created each render loops forever.
  const deferredCategory = useDeferredValue(category);
  const [location, setLocationState] = useState<SelectedLocation | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);

  const current = useCurrentLocation();

  useEffect(() => {
    const id = setTimeout(() => setDebouncedText(text), 400);
    return () => clearTimeout(id);
  }, [text]);

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
      category: deferredCategory,
      text: debouncedText.trim() || undefined,
    }),
    [location, deferredCategory, debouncedText],
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
  // A filter changed but the deferred category / the fetch hasn't caught
  // up: clear the old list to a skeleton until the new one fades in.
  const loading = query.isFetching || category !== deferredCategory;

  return {
    sections,
    hasResults: sections.some((s) => s.items.length > 0),
    loading,
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
