/**
 * Server-side re-implementation of firestore.rules' canReadOwnedBy
 * (functional_specification.md §3.6) — the single place this visibility
 * rule is duplicated in application code, shared by getFeed and
 * getTrending (both run under the Admin SDK, which bypasses security
 * rules entirely, so they are the actual enforcement point for who can
 * see whose experiences in Feed/Trending).
 */
export type PrivacySetting = 'public' | 'private' | 'friends';

export function isVisibleTo(
  viewerId: string,
  candidateOwnerId: string,
  ownerPrivacySetting: PrivacySetting | undefined,
  friendIds: ReadonlySet<string>,
): boolean {
  if (candidateOwnerId === viewerId) return true;
  if (ownerPrivacySetting === 'public') return true;
  if (ownerPrivacySetting === 'friends') return friendIds.has(candidateOwnerId);
  return false;
}
