/**
 * Candidate pool for Group Recommendations (functional_specification.md
 * §6.2) — same privacy-query fix pattern as Feed/Trending
 * (see functions/src/lib/feed.ts's header for the full explanation): the
 * client used to fetch this pool directly via a client-side Firestore
 * query (ExperienceRepository.listRecentForFeed), which firestore.rules
 * rejects outright the instant any candidate's owner isn't public. This
 * runs under the Admin SDK and re-applies that same visibility rule in
 * code via lib/visibility.ts.
 *
 * A candidate qualifies for the pool if it's public, or owned by one of
 * the group's own collaborators (self-content is always fair to
 * recommend back to the group) — a simpler bar than requiring every
 * individual collaborator to independently pass a friends-only check,
 * which isn't worth the extra per-collaborator friend-list fetches for a
 * general MVP candidate pool.
 */
import { FeedCandidate, FeedStore } from './feed';
import { VisibilityStore } from './ports';

export interface GroupCandidateResult {
  experienceId: string;
  title: string;
}

export async function getGroupRecommendationCandidates(
  stores: { candidateStore: Pick<FeedStore, 'listRecent'>; visibilityStore: VisibilityStore },
  collaboratorIds: string[],
  limit = 10,
): Promise<GroupCandidateResult[]> {
  const pool: FeedCandidate[] = await stores.candidateStore.listRecent(limit * 5);
  const collaboratorSet = new Set(collaboratorIds);

  const ownerIdsToCheck = [...new Set(pool.map((c) => c.ownerId).filter((id) => !collaboratorSet.has(id)))];
  const privacyByOwner = await stores.visibilityStore.getPrivacySettings(ownerIdsToCheck);

  return pool
    .filter((c) => collaboratorSet.has(c.ownerId) || privacyByOwner[c.ownerId] === 'public')
    .slice(0, limit)
    .map((c) => ({ experienceId: c.experienceId, title: c.title }));
}
