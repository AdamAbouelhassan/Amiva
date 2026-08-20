/**
 * Search — functional_specification.md §5.3: free text + location +
 * category, personalized ranking, recent-search history (capped at 10,
 * FIFO — technical_specification.md §3.1).
 *
 * Simplification: Firestore has no full-text search, and no search
 * service (Algolia/Typesense/etc.) is named in technical_specification.md
 * §1's stack. This filters the same recent-experiences page the feed
 * uses, client-side, by substring match on title/city/country plus a
 * minimum-match-on-category filter, then ranks by personalized match
 * score. Real search-at-scale (and the "draws from... the broader Google
 * Places catalog" half of §5.3) would need a dedicated search index —
 * flagged here rather than faked.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { defaultMatchScorer, RECENT_SEARCHES_MAX, TravelStyleCategory } from '@amiva/core';
import { ExperienceRepository } from '../../../repositories/experienceRepository';
import { UserRepository } from '../../../repositories/userRepository';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export function useSearch() {
  const { profile, firebaseUser, refetchProfile } = useCurrentUser();
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<TravelStyleCategory | undefined>();

  const experiencesQuery = useQuery({
    queryKey: ['experiences', 'searchPool'],
    queryFn: () => ExperienceRepository.listRecentForFeed(200),
  });

  const results = useMemo(() => {
    if (!experiencesQuery.data || !profile) return [];
    const textLower = text.trim().toLowerCase();
    const locationLower = location.trim().toLowerCase();

    return experiencesQuery.data
      .filter((experience) => {
        const matchesText = !textLower || experience.title.toLowerCase().includes(textLower);
        const matchesLocation =
          !locationLower ||
          experience.city.toLowerCase().includes(locationLower) ||
          experience.country.toLowerCase().includes(locationLower);
        const matchesCategory = !category || experience.categoryScores[category] >= 6;
        return matchesText && matchesLocation && matchesCategory;
      })
      .map((experience) => ({
        experience,
        matchScore: defaultMatchScorer.score(profile.travelStyle, experience.categoryScores),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [experiencesQuery.data, profile, text, location, category]);

  const recordSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      if (!firebaseUser || !profile || !query.trim()) return;
      const next = [query.trim(), ...profile.recentSearches.filter((s) => s !== query.trim())].slice(
        0,
        RECENT_SEARCHES_MAX,
      );
      await UserRepository.updateRecentSearches(firebaseUser.uid, next);
      await refetchProfile();
    },
  });

  return {
    text,
    setText,
    location,
    setLocation,
    category,
    setCategory,
    results,
    isLoading: experiencesQuery.isLoading,
    recentSearches: profile?.recentSearches ?? [],
    recordSearch: (query: string) => recordSearchMutation.mutate(query),
  };
}
