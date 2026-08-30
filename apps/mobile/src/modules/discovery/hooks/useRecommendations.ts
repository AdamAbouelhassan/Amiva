/**
 * Recommendations — functional_specification.md §5.2, rebuilt (Discover
 * rebuild, 2026-08-30) to pull directly from the Google Places catalog
 * rather than existing Amiva posts — "doesn't have anything to do with
 * other users." Filterable by country (required)/city/category, plus free
 * text, via the getPlaceRecommendations callable (see
 * functions/src/lib/placeRecommendations.ts for why this runs server-side
 * rather than a direct client fetch to Google).
 */
import { useQuery } from '@tanstack/react-query';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { TravelStyleCategory, TravelStyleVector } from '@amiva/core';
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
}

const getPlaceRecommendationsCallable = httpsCallable<
  { filter: PlaceRecommendationFilter; limit?: number },
  PlaceRecommendationResult[]
>(functions, 'getPlaceRecommendations');

export function useRecommendations() {
  const [text, setText] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<TravelStyleCategory | undefined>();

  const filter: PlaceRecommendationFilter = {
    country: country.trim(),
    city: city.trim() || undefined,
    category,
    text: text.trim() || undefined,
  };
  const hasCountry = filter.country.length > 0;

  const query = useQuery({
    queryKey: ['placeRecommendations', filter],
    queryFn: async () => (await getPlaceRecommendationsCallable({ filter })).data,
    enabled: hasCountry,
  });

  return {
    results: query.data ?? [],
    isLoading: query.isLoading,
    // Surfaced explicitly rather than silently showing "no results" — a
    // thrown callable error (missing server-side API key, Places request
    // failure, etc.) should be visible, not indistinguishable from a
    // legitimately empty result set (CLAUDE.md: this exact silent-failure
    // shape has bitten Onboarding/Settings before).
    error: query.error instanceof Error ? query.error.message : undefined,
    hasSearched: hasCountry,
    text,
    setText,
    country,
    setCountry,
    city,
    setCity,
    category,
    setCategory,
  };
}
