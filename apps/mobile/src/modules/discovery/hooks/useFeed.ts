/**
 * Social feed — functional_specification.md §5.1, ranked per
 * technical_specification.md §4.3's tier algorithm.
 *
 * Match score here is computed client-side with @amiva/core's shared
 * cosine implementation rather than round-tripping the `computeMatchScore`
 * callable per feed item. This does not violate CLAUDE.md principle #2
 * ("never let client-side computation silently become the source of
 * truth for something another user will see"): both inputs are already
 * server-persisted (the viewer's own travelStyle, and each experience's
 * own categoryScores), the output is shown only to the computing viewer,
 * nothing is persisted from it, and technical_specification.md §4.3
 * explicitly allows "on-read computation" for feed ranking at MVP data
 * volumes — this is that, applied per-item instead of via a scheduled
 * aggregation.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { defaultMatchScorer, HIGH_MATCH_THRESHOLD, sortFeed } from '@amiva/core';
import { ExperienceRepository } from '../../../repositories/experienceRepository';
import { FriendRepository } from '../../../repositories/friendRepository';
import { ExperienceDoc } from '../../../repositories/types';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export interface FeedItem {
  experience: ExperienceDoc;
  isFriend: boolean;
  matchScore: number;
  createdAt: Date;
}

export function useFeed() {
  const { profile } = useCurrentUser();

  const experiencesQuery = useQuery({
    queryKey: ['experiences', 'feed'],
    queryFn: () => ExperienceRepository.listRecentForFeed(),
    enabled: !!profile,
  });

  const friendsQuery = useQuery({
    queryKey: ['friends', profile?.uid],
    queryFn: () => FriendRepository.listByUser(profile!.uid),
    enabled: !!profile,
  });

  const items = useMemo<FeedItem[]>(() => {
    if (!profile || !experiencesQuery.data) return [];
    const friendIds = new Set((friendsQuery.data ?? []).map((edge) => edge.friendId));

    const unranked = experiencesQuery.data
      .filter((experience) => experience.ownerId !== profile.uid)
      .map((experience) => ({
        experience,
        isFriend: friendIds.has(experience.ownerId),
        matchScore: defaultMatchScorer.score(profile.travelStyle, experience.categoryScores),
        createdAt: experience.createdAt,
      }));

    return sortFeed(unranked, HIGH_MATCH_THRESHOLD);
  }, [profile, experiencesQuery.data, friendsQuery.data]);

  return {
    items,
    isLoading: experiencesQuery.isLoading || friendsQuery.isLoading,
    refetch: experiencesQuery.refetch,
  };
}
