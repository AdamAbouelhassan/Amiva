/**
 * Browse Google Places near a fixed location (a planned trip's
 * destination) to add to its itinerary. Reuses the `getPlaceRecommendations`
 * callable that backs Discovery's Local tab — same result shape, but the
 * location is locked instead of user-controlled.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { CategoryId } from '@amiva/core';
import { functions } from '../../../firebase/client';
import type {
  LocalSection,
  PlaceRecommendationFilter,
} from '../../discovery/hooks/useRecommendations';

const callable = httpsCallable<{ filter: PlaceRecommendationFilter }, LocalSection[]>(
  functions,
  'getPlaceRecommendations',
);

export function usePlaceSearch(place: { country: string; city?: string }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CategoryId | undefined>();

  const filter = useMemo<PlaceRecommendationFilter>(
    () => ({ country: place.country, city: place.city, category, text: text.trim() || undefined }),
    [place.country, place.city, category, text],
  );

  const query = useQuery({
    queryKey: ['placeRecommendations', filter],
    queryFn: async () => (await callable({ filter })).data,
    enabled: filter.country.length > 0,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

  const sections = query.data ?? [];
  return {
    sections,
    hasResults: sections.some((s) => s.items.length > 0),
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : undefined,
    text,
    setText,
    category,
    setCategory,
  };
}
