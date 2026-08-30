/**
 * Cloud Functions entry point. Every export here is a thin trigger (see
 * src/triggers/*) delegating to a tested plain function in src/lib
 * (CLAUDE.md #4, #8). This file itself contains no business logic.
 */
export { onExperienceCreated } from './triggers/onExperienceCreated';
export { onSaveCreated } from './triggers/onSaveCreated';
export { onFriendAdded } from './triggers/onFriendAdded';
export { onTravelStyleChanged } from './triggers/onTravelStyleChanged';
export { computeMatchScore } from './triggers/computeMatchScore';
export { convertPlannedTripToLogbook } from './triggers/convertPlannedTripToLogbook';
export { getTrending } from './triggers/getTrending';
export { sendNotification } from './triggers/sendNotification';

// Discover rebuild (2026-08-30): getFeed joins getTrending as a second
// Admin-SDK-backed read aggregation, both now the actual enforcement point
// for experience-read privacy (see lib/feed.ts's header for why).
export { getFeed } from './triggers/getFeed';
export { getPlaceRecommendations } from './triggers/getPlaceRecommendations';

// Additions beyond the technical spec's §5 table, each required to make an
// already-specified product behavior actually work under §6's security
// model (server-only writes for computed fields) — see the header comment
// in each trigger file for why.
export { computeGroupRecommendation } from './triggers/computeGroupRecommendation';
// Fixes the same privacy-query bug Feed/Trending had — see
// functions/src/lib/groupRecommendationCandidates.ts.
export { getGroupRecommendationCandidates } from './triggers/getGroupRecommendationCandidates';
export { updateTravelStyleManual } from './triggers/updateTravelStyleManual';
export { upsertPlace } from './triggers/upsertPlace';
export { matchContacts } from './triggers/matchContacts';
