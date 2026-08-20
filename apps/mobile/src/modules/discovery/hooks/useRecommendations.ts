/**
 * Recommendations — functional_specification.md §5.2: experiences the
 * user hasn't logged, with a match score, filterable by location.
 *
 * Simplification: sources only from existing Amiva user-generated
 * experiences (excluding the viewer's own and anything already saved),
 * ranked by match score. The spec's other named source — "the broader
 * Google Places catalog" — needs a real recommendation pipeline (querying
 * Places by category affinity, not just autocomplete) that's out of scope
 * for this scaffold; flagged rather than faked.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { defaultMatchScorer } from '@amiva/core';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { ExperienceRepository } from '../../../repositories/experienceRepository';
import { SaveRepository } from '../../../repositories/saveRepository';

export function useRecommendations() {
  const { profile } = useCurrentUser();
  const [locationFilter, setLocationFilter] = useState('');

  const experiencesQuery = useQuery({
    queryKey: ['experiences', 'recommendationPool'],
    queryFn: () => ExperienceRepository.listRecentForFeed(200),
    enabled: !!profile,
  });
  const savedQuery = useQuery({
    queryKey: ['saves', profile?.uid],
    queryFn: () => SaveRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });

  const results = useMemo(() => {
    if (!profile || !experiencesQuery.data) return [];
    const savedIds = new Set((savedQuery.data ?? []).map((s) => s.experienceId));
    const locationLower = locationFilter.trim().toLowerCase();

    return experiencesQuery.data
      .filter((experience) => experience.ownerId !== profile.uid && !savedIds.has(experience.experienceId))
      .filter(
        (experience) =>
          !locationLower ||
          experience.city.toLowerCase().includes(locationLower) ||
          experience.country.toLowerCase().includes(locationLower),
      )
      .map((experience) => ({ experience, matchScore: defaultMatchScorer.score(profile.travelStyle, experience.categoryScores) }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [profile, experiencesQuery.data, savedQuery.data, locationFilter]);

  return { results, isLoading: experiencesQuery.isLoading, locationFilter, setLocationFilter };
}
